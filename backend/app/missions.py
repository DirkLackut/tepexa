"""Misiones guardadas e informe (spec 004).

- La ruta se recalcula en el servidor con el perfil elegido (RF-004-01): no se confía en la del navegador.
- Sin datos personales (RF-004-03): `crew` son identificadores de avatar.
- Límites (CE-3): 10 misiones por IP cada 10 min y como máximo MAX_MISSIONS guardadas (se borran las más viejas).
"""
import math
import secrets
import threading
import time
from collections import deque
from datetime import datetime, timezone

from psycopg.types.json import Jsonb

from .contract import (
    LocalizedText as T, Mission, MissionCreate, MissionReport, PoiCollection, RegionDetail, Source,
)
from .db import connection
from .errors import rate_limited
from .routing import engine, walking
from .routing.terrain import Terrain

MAX_MISSIONS = 2000
RATE_WINDOW_S = 600
RATE_MAX = 10
POI_MATCH_M = 30.0

_hits: dict[str, deque] = {}
_lock = threading.Lock()


def check_rate(client: str, now: float | None = None) -> None:
    now = time.monotonic() if now is None else now
    with _lock:
        q = _hits.setdefault(client, deque())
        while q and now - q[0] > RATE_WINDOW_S:
            q.popleft()
        if len(q) >= RATE_MAX:
            raise rate_limited(int(RATE_WINDOW_S - (now - q[0])) + 1)
        q.append(now)


def reset_rate_limits() -> None:
    with _lock:
        _hits.clear()


def build(body: MissionCreate, region: RegionDetail, terrain: Terrain):
    """Devuelve (misión, petición de ruta). Lanza NO_ROUTE / NODATA como /routes/compare."""
    req = body.route_request
    params = engine.normalize_params(req.params or region.route_defaults)
    params = params.model_copy(update={"profiles": [body.selected_profile]})
    route = engine.plan_routes(terrain, req.start, req.targets, params)[0]
    return Mission(id="m-" + secrets.token_urlsafe(9), is_example=terrain.is_example,
                   created_at=datetime.now(timezone.utc), name=body.name, region_id=region.id,
                   selected_profile=body.selected_profile, crew=body.crew, params_used=params, route=route,
                   dataset_version=terrain.dataset_version, algorithm_version=engine.ALGORITHM_VERSION), req


def save(m: Mission, route_request) -> None:
    with connection() as conn:
        conn.execute(
            "insert into missions (id, created_at, name, region_id, selected_profile, crew, route_request, params_used,"
            " route, is_example, dataset_version, algorithm_version) values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (m.id, m.created_at, m.name, m.region_id, m.selected_profile.value, Jsonb(m.crew),
             Jsonb(route_request.model_dump(mode="json")), Jsonb(m.params_used.model_dump(mode="json")),
             Jsonb(m.route.model_dump(mode="json")), m.is_example, m.dataset_version, m.algorithm_version))
        conn.execute("delete from missions where id in (select id from missions order by created_at desc offset %s)",
                     (MAX_MISSIONS,))


def load(mission_id: str) -> tuple[Mission, dict] | None:
    with connection() as conn:
        r = conn.execute("select * from missions where id = %s", (mission_id,)).fetchone()
    if r is None:
        return None
    m = Mission(id=r["id"], is_example=r["is_example"], created_at=r["created_at"], name=r["name"],
                region_id=r["region_id"], selected_profile=r["selected_profile"], crew=r["crew"],
                params_used=r["params_used"], route=r["route"], dataset_version=r["dataset_version"],
                algorithm_version=r["algorithm_version"])
    return m, r["route_request"]


# ---------------------------------------------------------------- informe
def _dedupe(sources: list[Source]) -> list[Source]:
    seen, out = set(), []
    for s in sources:
        key = (s.url, s.product_id)
        if key not in seen:
            seen.add(key)
            out.append(s)
    return out


def _fmt_duration(minutes: float) -> tuple[str, str]:
    h, mnt = divmod(int(round(minutes)), 60)
    return (f"{h} h {mnt} min", f"{h} h {mnt} min") if h else (f"{mnt} min", f"{mnt} min")


def report(m: Mission, route_request: dict, region: RegionDetail, pois: PoiCollection,
           terrain_source: Source | None, has_soft_soil_data: bool) -> MissionReport:
    targets = route_request["targets"]
    visited, sources = [], []
    for k, (x, y) in enumerate(targets, start=1):
        best = min(pois.features, key=lambda f: math.dist(f.geometry.coordinates, (x, y)), default=None)
        if best is not None and math.dist(best.geometry.coordinates, (x, y)) <= POI_MATCH_M:
            visited.append(best.properties.name)
            sources.extend(best.properties.evidence)
        else:
            visited.append(T(es=f"Objetivo {k} ({x:.0f}, {y:.0f} m)", en=f"Target {k} ({x:.0f}, {y:.0f} m)"))
    if terrain_source:
        sources.insert(0, terrain_source)
    for fact in region.facts:
        sources.extend(fact.sources)

    tot = m.route.total
    p = m.params_used
    dur_es, dur_en = _fmt_duration(tot.est_duration_min)
    prof = {"shortest": ("más corta", "shortest"), "fastest": ("más rápida", "fastest"),
            "safest": ("más segura", "safest")}[m.selected_profile.value]
    trip_es = "de ida y vuelta" if m.route.return_trip else "de ida"
    trip_en = "round-trip" if m.route.return_trip else "one-way"
    name = m.name or m.id
    limitations = [
        T(es="No se modelan radiación, energía del traje, comunicaciones ni el clima.",
          en="Radiation, suit power, communications and weather are not modelled."),
        T(es=f"La ruta se calcula sobre una rejilla de {terrain_cell(m)} m: no ve rocas sueltas más pequeñas.",
          en=f"The route is computed on a {terrain_cell(m)} m grid: it does not see smaller loose rocks."),
    ]
    if not has_soft_soil_data:
        limitations.append(T(es="Todavía no hay datos de inercia térmica: el suelo suelto no se tiene en cuenta.",
                             en="There is no thermal-inertia data yet: loose soil is not taken into account."))
    if m.is_example:
        limitations.insert(0, T(es="Terreno de ejemplo: no son datos de NASA.", en="Example terrain: not NASA data."))
    return MissionReport(
        mission_id=m.id, is_example=m.is_example,
        title=T(es=f"Informe de misión — {name}", en=f"Mission report — {name}"),
        summary=T(es=f"Caminata {trip_es} desde la base por {len(targets)} objetivos: {tot.distance_m / 1000:.2f} km en {dur_es}, ruta {prof[0]}."
                     + ("" if m.route.within_eva_limit else " Supera el límite de EVA."),
                  en=f"{trip_en.capitalize()} walk from the base through {len(targets)} targets: {tot.distance_m / 1000:.2f} km in {dur_en}, {prof[1]} route."
                     + ("" if m.route.within_eva_limit else " It exceeds the EVA limit.")),
        metrics=tot, objectives_visited=visited, sources=_dedupe(sources),
        assumptions=[
            T(es=f"Velocidad según la pendiente: función de Tobler ajustada a {walking.FLAT_SPEED_KMH:g} km/h en llano, el ritmo con traje que usa NASA.",
              en=f"Speed by slope: Tobler's function scaled to {walking.FLAT_SPEED_KMH:g} km/h on flat ground, the suited pace NASA uses."),
            T(es=f"Pendiente máxima de {p.max_slope_deg:g}° y límite de EVA de {p.eva_time_limit_min:g} min: referencias de NASA para la Luna; no hay límites oficiales para Marte.",
              en=f"Maximum slope of {p.max_slope_deg:g}° and an EVA limit of {p.eva_time_limit_min:g} min: NASA reference values for the Moon; there are no official Mars limits."),
            T(es="No se ajusta la velocidad a la gravedad de Marte (0.38 g).", en="Speed is not adjusted to Mars gravity (0.38 g)."),
            T(es="Los objetivos están donde estuvo Perseverance ese sol (±10 m).",
              en="Targets are where Perseverance stood that sol (±10 m)."),
        ],
        limitations=limitations, disclaimer=engine.DISCLAIMER, generated_at=datetime.now(timezone.utc))


def terrain_cell(m: Mission) -> int:
    return int(m.route.cost_model.parameters.get("grid_cell_m", 10))
