"""Spec 002 · Catálogo REAL de Jezero (Margin Unit) sobre el DTM HiRISE → semilla 002.

Puntos de interés: posición de Perseverance el sol en que tomó o abrió cada roca (travesía
oficial NASA/JPL, MMGIS), llevada al marco local del recorte (procesar_dtm.py). La base de la
misión es una elección del equipo, no un sitio de NASA, y así se dice.

Uso: python pipeline/jezero/catalogo_hirise.py
Salida: backend/db/seeds/002_jezero_hirise.sql (idempotente; reemplaza solo la región jezero-margin)
"""
import json
import math
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "backend"))
sys.path.insert(0, str(REPO / "backend" / "db" / "tools"))

from app.contract import (  # noqa: E402
    Availability, Bounds, CoordinateFrame, ElevationRange, LocalizedText as T, MarsLocation, PoiCollection,
    PoiFeature, PoiProperties, PointGeometry, RegionDetail, Source,
)
from app.routing import walking  # noqa: E402
from generar_semilla import build_sql  # noqa: E402

OUT = REPO / "backend" / "db" / "seeds" / "002_jezero_hirise.sql"
EXAMPLES = REPO / "contracts" / "examples"
META = json.loads((REPO / "data" / "raw" / "jezero-margin" / "dtm-2m-meta.json").read_text(encoding="utf-8"))
DATASET = "hirise-v1"

R = META["frame"]["mars_radius_m"]
LAT_C, LON_C = META["frame"]["center_lat_deg"], META["frame"]["center_lon_east_deg"]
K = math.cos(math.radians(LAT_C))


def local_xy(lat: float, lon: float) -> tuple[float, float]:
    x = (R * math.radians(lon) - R * math.radians(LON_C)) * K + META["frame"]["width_m"] / 2
    y = R * math.radians(lat) - R * math.radians(LAT_C) + META["frame"]["height_m"] / 2
    return round(x, 1), round(y, 1)


def dtm():
    q = np.fromfile(REPO / "data" / "raw" / "jezero-margin" / "dtm-2m-q16.bin", dtype="<u2").reshape(META["rows"], META["cols"])
    return META["zbase"] + (q.astype(float) - 1) * META["step_m"]


Z = dtm()


def z_at(x: float, y: float) -> float:
    return round(float(Z[int(round(y / META["cell_m"])), int(round(x / META["cell_m"]))]), 2)


# ---------------------------------------------------------------- fuentes
SRC_DTM = Source(**{k: META["source"][k] for k in ("mission", "instrument", "product_id", "url", "attribution")},
                 license_note="USGS: «Please cite authors»")
SRC_TRAVERSE = Source(mission="Mars 2020 (Perseverance)", instrument="Navegación del rover (localizaciones por sol)",
                      product_id="M20_waypoints_sol2022_all",
                      url="https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json",
                      attribution="NASA/JPL-Caltech (MMGIS)")
SRC_CARBONATES = Source(mission="Mars 2020 (Perseverance)", instrument="SuperCam, PIXL, SHERLOC, WATSON",
                        url="https://science.nasa.gov/blog/carving-into-carbonates-at-old-faithful-geyser",
                        attribution="NASA Science; D. Buckner (2024), «Carving Into Carbonates at Old Faithful Geyser»")
SRC_RIM = Source(mission="Mars 2020 (Perseverance)", instrument="WATSON, SuperCam",
                 url="https://science.nasa.gov/blog/margin-up-the-crater-rim",
                 attribution="NASA Science (2024), «Margin up the crater rim»")


def sample_poi(pid, sol, lat, lon, name, desc, kind_es, kind_en, src, episode=1):
    x, y = local_xy(lat, lon)
    note = T(es=f"Posición de Perseverance el sol {sol} según su travesía oficial (±10 m). "
                + ("Asociarla al episodio 1 es una interpretación nuestra: la roca contiene carbonato."
                   if episode else ""),
             en=f"Perseverance's position on sol {sol} from its official traverse (±10 m). "
                + ("Linking it to episode 1 is our interpretation: the rock contains carbonate." if episode else ""))
    return PoiFeature(id=pid, geometry=PointGeometry(coordinates=(x, y)), properties=PoiProperties(
        id=pid, name=name, category="science_target" if episode else "waypoint",
        description=T(es=f"{kind_es} (sol {sol}). {desc[0]}", en=f"{kind_en} (sol {sol}). {desc[1]}"),
        water_episode=episode, elevation_m=z_at(x, y), evidence=[src, SRC_TRAVERSE], images=[], confidence_note=note))


BASE_XY = (2950.0, 1100.0)
FEATURES = [
    PoiFeature(id="base", geometry=PointGeometry(coordinates=BASE_XY), properties=PoiProperties(
        id="base", name=T(es="Base de la misión", en="Mission base"), category="base",
        description=T(es="Punto de salida y regreso de la caminata.", en="Start and return point of the walk."),
        elevation_m=z_at(*BASE_XY), evidence=[SRC_DTM], images=[],
        confidence_note=T(es="Ubicación elegida por el equipo de TEPEXA en una zona plana del DTM (pendiente < 6° en 30 m). No es un sitio de NASA.",
                          en="Location chosen by the TEPEXA team on a flat area of the DTM (slope < 6° over 30 m). Not a NASA site."))),
    sample_poi("pelican-point", 923, 18.4834427, 77.3506942, T(es="Pelican Point", en="Pelican Point"),
               ("Núcleo de roca con carbonato tomado por Perseverance.", "Carbonate-bearing rock core collected by Perseverance."),
               "Muestra de núcleo", "Core sample", SRC_CARBONATES),
    sample_poi("lefroy-bay", 942, 18.4887146, 77.3470434, T(es="Lefroy Bay", en="Lefroy Bay"),
               ("Núcleo de roca con carbonato; sus granos y minerales son distintos a los de Pelican Point.",
                "Carbonate-bearing rock core; its grains and minerals differ from Pelican Point."),
               "Muestra de núcleo", "Core sample", SRC_CARBONATES),
    sample_poi("comet-geyser", 1088, 18.4918327, 77.3272028, T(es="Comet Geyser", en="Comet Geyser"),
               ("Tercer núcleo con carbonato de la Margin Unit.", "Third carbonate-bearing core from the Margin Unit."),
               "Muestra de núcleo", "Core sample", SRC_CARBONATES),
    sample_poi("old-faithful-geyser", 1151, 18.4907108, 77.3135897, T(es="Old Faithful Geyser", en="Old Faithful Geyser"),
               ("Roca con carbonato abierta con la abrasión, en la parte oeste de la Margin Unit.",
                "Carbonate-bearing rock opened by abrasion, in the western Margin Unit."),
               "Abrasión", "Abrasion", SRC_CARBONATES),
    sample_poi("eremita-mesa", 1261, 18.4877297, 77.2985208, T(es="Eremita Mesa", en="Eremita Mesa"),
               ("Última parada en la Margin Unit antes de subir al borde del cráter.",
                "Last stop in the Margin Unit before climbing the crater rim."),
               "Abrasión", "Abrasion", SRC_RIM, episode=None),
]


def region() -> RegionDetail:
    ex = json.loads((EXAMPLES / "region-jezero.json").read_text(encoding="utf-8"))
    zmin, zmax = float(np.nanmin(Z[1:-1, 1:-1])), float(np.nanmax(Z[1:-1, 1:-1]))
    return RegionDetail(
        id="jezero-margin", name=T(**ex["name"]), status="active",
        summary=T(**ex["summary"]),
        center=MarsLocation(lat_deg=LAT_C, lon_east_deg=LON_C, approximate=False), thumbnail_url=None,
        is_example=False, dataset_version=DATASET,
        coordinate_frame=CoordinateFrame(
            id="jezero-margin-local-m",
            description=T(es="Metros sobre el terreno desde la esquina suroeste de un recorte de 4 × 3 km centrado en 18.487° N, 77.325° E: x al este, y al norte, z elevación sobre el geoide de Marte.",
                          en="Ground metres from the south-west corner of a 4 × 3 km crop centred at 18.487° N, 77.325° E: x east, y north, z elevation above the Mars geoid."),
            source_crs="Mars 2000 esfera IAU (R = 3 396 190 m), equirectangular; transformación en pipeline/jezero/procesar_dtm.py"),
        bounds=Bounds(min_x=0, min_y=0, max_x=META["frame"]["width_m"], max_y=META["frame"]["height_m"]),
        elevation_range=ElevationRange(min_m=round(zmin, 1), max_m=round(zmax, 1)),
        mission_objective=T(
            es="Salir de la base y visitar, en orden, las rocas con carbonato donde Perseverance tomó muestras en la Margin Unit; la parada opcional es Eremita Mesa, al pie del borde del cráter.",
            en="Leave the base and visit, in order, the carbonate-bearing rocks Perseverance sampled in the Margin Unit; the optional stop is Eremita Mesa, at the foot of the crater rim."),
        facts=ex["facts"], route_defaults=json.loads((EXAMPLES / "route-request.json").read_text(encoding="utf-8"))["params"],
        available=Availability(layers=True, pois=True, routes=True, terrain_3d=True))


def main():
    reg = region()
    pois = PoiCollection(region_id="jezero-margin", coordinate_frame="jezero-margin-local-m", is_example=False,
                         features=FEATURES)
    for f in FEATURES:
        x, y = f.geometry.coordinates
        assert 0 <= x <= 4000 and 0 <= y <= 3000, f.id
    assert reg.route_defaults.walking_model == walking.MODEL_NAME
    sql, n = build_sql([reg.model_dump(mode="json")], ["jezero-margin", "medusae-fossae"],
                       [pois.model_dump(mode="json")], [
        "-- Spec 002 · Catálogo REAL de Jezero sobre el DTM HiRISE (generado; no editar a mano).",
        "-- Generado por pipeline/jezero/catalogo_hirise.py. Reemplaza solo la región jezero-margin.",
        "-- Idempotente. En Neon: pegar completo en el SQL Editor (después de 001).",
    ])
    OUT.write_text(sql, encoding="utf-8")
    print(f"{OUT.relative_to(REPO)}: {n} fuentes, {len(FEATURES)} puntos")
    for f in FEATURES:
        print(f"  {f.id:20s} {f.geometry.coordinates}  z={f.properties.elevation_m}")


if __name__ == "__main__":
    main()
