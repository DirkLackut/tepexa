"""Motor de rutas (spec 003): grafo de 8 vecinos sobre la rejilla y Dijkstra de SciPy (D-20).

Costo por perfil (D-24):
- shortest: distancia 3D.
- fastest:  tiempo con el modelo de caminata.
- safest:   tiempo × (1 + p·suelo suelto) × (1 + (θ/θmáx)²).
Los tramos con pendiente mayor que la máxima o con NoData no existen en el grafo.
"""
import math
from datetime import datetime, timezone

import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra

from ..contract import (
    Advisory, CostModel, LocalizedText as T, ProfilePoint, Route, RouteComparison, RouteLeg, RouteMetrics,
    RouteParams, RouteProfile, RouteRequest, RouteResponse, RouteSegment, Severity, WarningCode,
)
from ..errors import no_route, unknown_walking_model
from . import walking
from .terrain import Terrain

ALGORITHM_VERSION = "routing-v1"
STEEP_FRACTION = 0.75  # D-25
OFFSETS = [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)]

DISCLAIMER = T(es="Planificación conceptual y educativa. No es una ruta certificada para operaciones reales.",
               en="Conceptual, educational planning. Not a route certified for real operations.")
W_EXAMPLE = Advisory(code=WarningCode.EXAMPLE_DATA, severity=Severity.info,
                     message=T(es="Datos de ejemplo: terreno sintético, no es un dato de NASA.",
                               en="Example data: synthetic terrain, not NASA data."))
W_CONCEPT = Advisory(code=WarningCode.CONCEPTUAL_ONLY, severity=Severity.info, message=DISCLAIMER)
W_SOFT = Advisory(code=WarningCode.SOFT_SOIL, severity=Severity.caution,
                  message=T(es="La ruta cruza una zona de suelo suelto según la inercia térmica.",
                            en="The route crosses an area of loose soil according to thermal inertia."))


def _w_steep(max_slope: float, limit: float) -> Advisory:
    return Advisory(code=WarningCode.STEEP_SEGMENT, severity=Severity.caution, message=T(
        es=f"Hay tramos de hasta {max_slope:.1f}°, cerca del límite de {limit:g}°.",
        en=f"Some segments reach {max_slope:.1f}°, close to the {limit:g}° limit."))


def _w_eva(total_min: float, limit: float) -> Advisory:
    return Advisory(code=WarningCode.EVA_LIMIT_EXCEEDED, severity=Severity.critical, message=T(
        es=f"Ida y vuelta toman unos {total_min:.0f} min: superan el límite de EVA de {limit:g} min.",
        en=f"The round trip takes about {total_min:.0f} min: it exceeds the {limit:g} min EVA limit."))


# ---------------------------------------------------------------- tramos de la rejilla
def _edge_terms(t: Terrain, a: np.ndarray, b: np.ndarray):
    """Magnitudes de cada tramo a→b (índices de nodo): distancia 3D, pendiente, tiempo y suelo suelto."""
    za, zb = t.z.flat[a], t.z.flat[b]
    xa, ya = t.xy(a)
    xb, yb = t.xy(b)
    h = np.hypot(xb - xa, yb - ya)
    dz = zb - za
    d3 = np.hypot(h, dz)
    with np.errstate(divide="ignore", invalid="ignore"):
        tan = np.where(h > 0, dz / h, 0.0)
    slope_deg = np.degrees(np.arctan(np.abs(tan)))
    minutes = d3 / 1000.0 / walking.speed_kmh(tan) * 60.0
    soft_frac = (t.soft.flat[a].astype(float) + t.soft.flat[b].astype(float)) / 2.0
    return d3, dz, slope_deg, minutes, soft_frac, tan


def _all_edges(t: Terrain):
    """Todos los tramos entre vecinos con datos, con sus magnitudes. Se calcula una vez por terreno."""
    if t._edges is not None:
        return t._edges
    rows, cols = t.shape
    idx = np.arange(rows * cols).reshape(rows, cols)
    src_all, dst_all = [], []
    for di, dj in OFFSETS:
        r0, r1 = max(0, -di), rows - max(0, di)
        c0, c1 = max(0, -dj), cols - max(0, dj)
        src_all.append(idx[r0:r1, c0:c1].ravel())
        dst_all.append(idx[r0 + di:r1 + di, c0 + dj:c1 + dj].ravel())
    src, dst = np.concatenate(src_all), np.concatenate(dst_all)
    ok = np.isfinite(t.z.flat[src]) & np.isfinite(t.z.flat[dst])
    src, dst = src[ok], dst[ok]
    d3, _, slope, minutes, soft_frac, _ = _edge_terms(t, src, dst)
    t._edges = (src, dst, d3, slope, minutes, soft_frac)
    return t._edges


def _graph(t: Terrain, p: RouteParams, profile: RouteProfile) -> csr_matrix:
    src, dst, d3, slope, minutes, soft_frac = _all_edges(t)
    ok = slope <= p.max_slope_deg + 1e-9
    src, dst, d3, slope, minutes, soft_frac = src[ok], dst[ok], d3[ok], slope[ok], minutes[ok], soft_frac[ok]
    if profile == RouteProfile.shortest:
        w = d3
    elif profile == RouteProfile.fastest:
        w = minutes
    else:
        w = minutes * (1.0 + p.soft_soil_penalty * soft_frac) * (1.0 + (slope / p.max_slope_deg) ** 2)
    n = t.z.size
    return csr_matrix((np.maximum(w, 1e-12), (src, dst)), shape=(n, n))


def _paths(g: csr_matrix, stops: list[int], pairs: list[tuple[int, int]], profile: RouteProfile, p: RouteParams):
    """Camino de nodos para cada par (posición en stops). Un Dijkstra por cada origen distinto."""
    sources = sorted({a for a, _ in pairs})
    dist, pred = dijkstra(g, directed=True, indices=[stops[a] for a in sources], return_predecessors=True)
    row = {a: k for k, a in enumerate(sources)}
    out = []
    for a, b in pairs:
        k, target = row[a], stops[b]
        if not np.isfinite(dist[k, target]):
            raise no_route(profile.value, a, b, p.max_slope_deg)
        nodes = [target]
        while nodes[-1] != stops[a]:
            nodes.append(int(pred[k, nodes[-1]]))
        out.append(nodes[::-1])
    return out


# ---------------------------------------------------------------- métricas y segmentos
def _metrics(t: Terrain, nodes: np.ndarray) -> RouteMetrics:
    if len(nodes) < 2:
        return RouteMetrics(distance_m=0, ascent_m=0, descent_m=0, max_slope_deg=0, mean_slope_deg=0,
                            est_duration_min=0, soft_soil_m=0)
    d3, dz, slope, minutes, soft_frac, _ = _edge_terms(t, nodes[:-1], nodes[1:])
    dist = float(d3.sum())
    return RouteMetrics(
        distance_m=round(dist, 2), ascent_m=round(float(dz[dz > 0].sum()), 2),
        descent_m=round(float(-dz[dz < 0].sum()), 2), max_slope_deg=round(float(slope.max()), 3),
        mean_slope_deg=round(float((slope * d3).sum() / dist), 3) if dist else 0.0,
        est_duration_min=round(float(minutes.sum()), 1), soft_soil_m=round(float((d3 * soft_frac).sum()), 2))


def _segment(t: Terrain, legs_nodes: list[list[int]], leg_ids: list[tuple[int, int]]) -> RouteSegment:
    nodes: list[int] = list(legs_nodes[0])
    legs = []
    start = 0
    for k, leg in enumerate(legs_nodes):
        if k:
            nodes.extend(leg[1:])
        end = len(nodes) - 1
        legs.append(RouteLeg(from_index=leg_ids[k][0], to_index=leg_ids[k][1], vertex_start=start, vertex_end=end,
                             metrics=_metrics(t, np.array(leg))))
        start = end
    arr = np.array(nodes)
    xs, ys = t.xy(arr)
    zs = t.z.flat[arr]
    poly = [(round(float(x), 2), round(float(y), 2), round(float(z), 2)) for x, y, z in zip(xs, ys, zs)]
    profile, s = [ProfilePoint(s_m=0, z_m=poly[0][2], slope_deg=0)], 0.0
    if len(arr) > 1:
        d3, _, _, _, _, tan = _edge_terms(t, arr[:-1], arr[1:])
        for k in range(len(d3)):
            s += float(d3[k])
            profile.append(ProfilePoint(s_m=round(s, 2), z_m=poly[k + 1][2],
                                        slope_deg=round(math.degrees(math.atan(float(tan[k]))), 3)))
    return RouteSegment(polyline=poly, metrics=_metrics(t, arr), legs=legs, elevation_profile=profile)


def _total(a: RouteMetrics, b: RouteMetrics | None) -> RouteMetrics:
    if b is None:
        return a
    d = a.distance_m + b.distance_m
    return RouteMetrics(
        distance_m=round(d, 2), ascent_m=round(a.ascent_m + b.ascent_m, 2), descent_m=round(a.descent_m + b.descent_m, 2),
        max_slope_deg=max(a.max_slope_deg, b.max_slope_deg),
        mean_slope_deg=round((a.mean_slope_deg * a.distance_m + b.mean_slope_deg * b.distance_m) / d, 3) if d else 0.0,
        est_duration_min=round(a.est_duration_min + b.est_duration_min, 1),
        soft_soil_m=round(a.soft_soil_m + b.soft_soil_m, 2))


def _cost_model(t: Terrain, p: RouteParams, profile: RouteProfile) -> CostModel:
    name = {"shortest": "distance-3d", "fastest": walking.MODEL_NAME,
            "safest": f"{walking.MODEL_NAME}+soft-soil+slope"}[profile.value]
    params = {"max_slope_deg": p.max_slope_deg, "grid_cell_m": t.cell_m, "flat_speed_kmh": walking.FLAT_SPEED_KMH,
              "tobler_a": round(walking.TOBLER_A, 4), "tobler_b": walking.TOBLER_B, "tobler_c": walking.TOBLER_C,
              "mars_gravity_adjusted": 0.0}
    if profile == RouteProfile.safest:
        params["soft_soil_penalty"] = p.soft_soil_penalty
    return CostModel(name=name, version=ALGORITHM_VERSION, parameters=params)


# ---------------------------------------------------------------- API del motor
def normalize_params(p: RouteParams) -> RouteParams:
    model = walking.resolve_model(p.walking_model)
    if model is None:
        raise unknown_walking_model(p.walking_model, [walking.MODEL_NAME])
    profiles = list(dict.fromkeys(p.profiles))
    return p.model_copy(update={"walking_model": model, "profiles": profiles})


def plan_routes(t: Terrain, start, targets, params: RouteParams) -> list[Route]:
    p = normalize_params(params)
    stops = [t.node(*start)] + [t.node(*xy) for xy in targets]
    n = len(targets)
    out_pairs = [(k, k + 1) for k in range(n)]
    pairs = out_pairs + ([(n, 0)] if p.include_return else [])
    routes = []
    for profile in p.profiles:
        g = _graph(t, p, profile)
        legs = _paths(g, stops, pairs, profile, p)
        outbound = _segment(t, legs[:n], out_pairs)
        back = _segment(t, [legs[n]], [(n, 0)]) if p.include_return else None
        total = _total(outbound.metrics, back.metrics if back else None)
        within = total.est_duration_min <= p.eva_time_limit_min
        warnings = ([W_EXAMPLE] if t.is_example else []) + [W_CONCEPT]
        if total.soft_soil_m > 0:
            warnings.append(W_SOFT)
        if total.max_slope_deg >= STEEP_FRACTION * p.max_slope_deg:
            warnings.append(_w_steep(total.max_slope_deg, p.max_slope_deg))
        if not within:
            warnings.append(_w_eva(total.est_duration_min, p.eva_time_limit_min))
        routes.append(Route(profile=profile, outbound=outbound, return_trip=back, total=total,
                            within_eva_limit=within, warnings=warnings, cost_model=_cost_model(t, p, profile)))
    return routes


def compare(t: Terrain, req: RouteRequest, params: RouteParams, frame_id: str,
            now: datetime | None = None) -> RouteResponse:
    p = normalize_params(params)
    routes = plan_routes(t, req.start, req.targets, p)
    by = {r.profile: r for r in routes}
    if RouteProfile.safest in by and by[RouteProfile.safest].within_eva_limit:
        rec, why = RouteProfile.safest, T(
            es="Evita más suelo suelto y pendientes cercanas al límite, y cabe en el tiempo de EVA.",
            en="It avoids more loose soil and slopes near the limit, and fits within the EVA time.")
    elif RouteProfile.fastest in by and by[RouteProfile.fastest].within_eva_limit:
        rec, why = RouteProfile.fastest, T(
            es="Es la única opción que cabe en el tiempo de EVA.",
            en="It is the only option that fits within the EVA time.")
    else:
        rec, why = None, T(es="Ninguna ruta cabe en el tiempo de EVA: reduzca objetivos o divida la misión.",
                           en="No route fits within the EVA time: drop targets or split the mission.")
    return RouteResponse(
        region_id=req.region_id, is_example=t.is_example, dataset_version=t.dataset_version,
        algorithm_version=ALGORITHM_VERSION, coordinate_frame=frame_id,
        computed_at=now or datetime.now(timezone.utc), request=req, params_used=p, routes=routes,
        comparison=RouteComparison(recommended_profile=rec, reason=why), disclaimer=DISCLAIMER)
