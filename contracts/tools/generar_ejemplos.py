"""Genera contracts/examples/*.json y contracts/openapi.json desde los modelos del contrato.

Todo lo que produce este script es de EJEMPLO (is_example: true): el terreno es una función
sintética y las rutas se calculan sobre ella para que sus métricas sean coherentes. Los hechos
científicos sí son reales y llevan su fuente.

Uso: python contracts/tools/generar_ejemplos.py
"""
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "backend"))

from app.contract import (  # noqa: E402
    Advisory, Availability, Bounds, Certainty, CoordinateFrame, CostModel, ElevationRange, ErrorBody,
    ErrorCode, ErrorResponse, Fact, Health, Heightmap, Layer, LayerList, Legend, LegendStop,
    LocalizedText as T, MarsLocation, Mission, MissionCreate, MissionReport, PoiCollection, PoiFeature,
    PoiImage, PoiProperties, PointGeometry, ProfilePoint, RegionDetail, RegionList, RegionStatus,
    RegionSummary, Route, RouteComparison, RouteLeg, RouteMetrics, RouteParams, RouteProfile,
    RouteRequest, RouteResponse, RouteSegment, SceneTransform, Severity, Source, TerrainLod,
    TerrainManifest, TerrainTexture, TileSource, WarningCode,
)
from app.openapi_export import build_openapi  # noqa: E402
from app.settings import ALL_ENDPOINTS, APP_VERSION  # noqa: E402

OUT = REPO / "contracts" / "examples"
NOW = datetime(2026, 11, 14, 0, 0, tzinfo=timezone.utc)
DATASET = "example-v0"
ALGO = "example-v0"
ASSETS = "https://assets.example.invalid"  # dominio reservado: deja claro que no es real

# ---------------------------------------------------------------- fuentes reales
JPL_MARGIN = Source(
    mission="Mars 2020 (Perseverance)", instrument="SuperCam, PIXL, Mastcam-Z",
    url="https://www.jpl.nasa.gov/news/nasa-discovery-reveals-complex-water-systems-on-early-mars/",
    attribution="NASA/JPL-Caltech; Bedford et al. (2026), Communications Earth & Environment",
)
ESA_MFF = Source(
    mission="Mars Express (ESA)", instrument="MARSIS",
    url="https://esa.int/Science_Exploration/Space_Science/Buried_water_ice_at_Mars_s_equator",
    attribution="ESA; Watters et al. (2024), Geophysical Research Letters",
)
JPL_MFF_2007 = Source(
    mission="Mars Express (ESA) / NASA JPL", instrument="MARSIS",
    url="https://www.jpl.nasa.gov/news/mars-express-probes-red-planets-unusual-deposits/",
    attribution="NASA/JPL; Watters et al. (2007), Science",
)
JHU_DUST = Source(
    mission="2001 Mars Odyssey", instrument="GRS",
    url="https://hub.jhu.edu/2018/07/31/mars-dust-medusae-fossae",
    attribution="Johns Hopkins University; Ojha et al. (2018), Nature Communications",
)
JHU_VOLC = Source(
    mission="Varias misiones orbitales (gravedad y radar)",
    url="https://www.sci.news/space/volcanic-eruptions-medusae-fossae-formation-mars-06112.html",
    attribution="Ojha y Lewis (2018), Journal of Geophysical Research: Planets",
)
PENDING = "PENDIENTE (spec 002)"
EX_ATTR = "Ejemplo: producto real por definir en la spec 002"
HIRISE = Source(mission="Mars Reconnaissance Orbiter", instrument="HiRISE", product_id=PENDING,
                url="https://www.uahirise.org/", attribution=EX_ATTR)
THEMIS = Source(mission="2001 Mars Odyssey", instrument="THEMIS", product_id=PENDING,
                url="https://themis.mars.asu.edu/", attribution=EX_ATTR)
CRISM = Source(mission="Mars Reconnaissance Orbiter", instrument="CRISM", product_id=PENDING,
               url="https://pds-geosciences.wustl.edu/missions/mro/crism.htm", attribution=EX_ATTR)
PERSEVERANCE_RAW = "https://mars.nasa.gov/mars2020/multimedia/raw-images/"

# ---------------------------------------------------------------- terreno sintético
W, H = 4000.0, 3000.0
BOUNDS = Bounds(min_x=0, min_y=0, max_x=W, max_y=H)
SOFT = (1800.0, 1150.0, 260.0)  # zona de suelo suelto (x, y, radio)
FRAME_ID = "jezero-margin-local-m"


def z(x: float, y: float) -> float:
    # colina entre los objetivos 2 y 3: la ruta más corta la cruza, la más rápida la rodea
    hill = 70.0 * math.exp(-((x - 2700.0) ** 2 + (y - 1600.0) ** 2) / (2 * 130.0 ** 2))
    return -2440.0 + 0.03 * x + 0.01 * y + 12.0 * math.sin(x / 300.0) * math.cos(y / 350.0) + hill


def soft(x: float, y: float) -> bool:
    return math.hypot(x - SOFT[0], y - SOFT[1]) <= SOFT[2]


# ---------------------------------------------------------------- rutas sintéticas
PARAMS = RouteParams(max_slope_deg=25, eva_time_limit_min=240,
                     profiles=[RouteProfile.shortest, RouteProfile.fastest, RouteProfile.safest],
                     include_return=True, soft_soil_penalty=2.0, walking_model="tobler-mars-v1")
MARS_SPEED_FACTOR = 0.8  # provisional (spec 003 lo investiga con fuente)


def tobler_kmh(slope: float) -> float:
    return 6.0 * math.exp(-3.5 * abs(slope + 0.05)) * MARS_SPEED_FACTOR


def densify(waypoints, step=25.0):
    pts, marks = [], [0]
    for (x0, y0), (x1, y1) in zip(waypoints, waypoints[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) // step))
        for i in range(n):
            t = i / n
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
        marks.append(len(pts))
    pts.append(waypoints[-1])
    return [(round(x, 2), round(y, 2), round(z(x, y), 2)) for x, y in pts], marks


def metrics(poly) -> RouteMetrics:
    dist = asc = desc = maxs = wslope = tmin = softm = 0.0
    for (x0, y0, z0), (x1, y1, z1) in zip(poly, poly[1:]):
        h = math.hypot(x1 - x0, y1 - y0)
        dz = z1 - z0
        d = math.hypot(h, dz)
        s = dz / h if h else 0.0
        sd = math.degrees(math.atan(abs(s)))
        dist += d
        asc += max(dz, 0)
        desc += max(-dz, 0)
        maxs = max(maxs, sd)
        wslope += sd * d
        tmin += d / 1000.0 / tobler_kmh(s) * 60.0
        if soft((x0 + x1) / 2, (y0 + y1) / 2):
            softm += d
    return RouteMetrics(distance_m=round(dist, 2), ascent_m=round(asc, 2), descent_m=round(desc, 2),
                        max_slope_deg=round(maxs, 3), mean_slope_deg=round(wslope / dist, 3) if dist else 0,
                        est_duration_min=round(tmin, 1), soft_soil_m=round(softm, 2))


def profile(poly):
    out, s = [ProfilePoint(s_m=0, z_m=poly[0][2], slope_deg=0)], 0.0
    for (x0, y0, z0), (x1, y1, z1) in zip(poly, poly[1:]):
        h = math.hypot(x1 - x0, y1 - y0)
        s += math.hypot(h, z1 - z0)
        out.append(ProfilePoint(s_m=round(s, 2), z_m=z1,
                                slope_deg=round(math.degrees(math.atan2(z1 - z0, h)), 3) if h else 0))
    return out


def segment(waypoints, stop_indices) -> RouteSegment:
    poly, marks = densify(waypoints)
    legs = []
    for k in range(len(stop_indices) - 1):
        a, b = marks[stop_indices[k]], marks[stop_indices[k + 1]]
        legs.append(RouteLeg(from_index=k, to_index=k + 1, vertex_start=a, vertex_end=b,
                             metrics=metrics(poly[a:b + 1])))
    return RouteSegment(polyline=poly, metrics=metrics(poly), legs=legs, elevation_profile=profile(poly))


def total(a: RouteMetrics, b: RouteMetrics) -> RouteMetrics:
    d = a.distance_m + b.distance_m
    return RouteMetrics(distance_m=round(d, 2), ascent_m=round(a.ascent_m + b.ascent_m, 2),
                        descent_m=round(a.descent_m + b.descent_m, 2),
                        max_slope_deg=max(a.max_slope_deg, b.max_slope_deg),
                        mean_slope_deg=round((a.mean_slope_deg * a.distance_m + b.mean_slope_deg * b.distance_m) / d, 3),
                        est_duration_min=round(a.est_duration_min + b.est_duration_min, 1),
                        soft_soil_m=round(a.soft_soil_m + b.soft_soil_m, 2))


BASE = (400.0, 600.0)
TARGETS = [(1400.0, 900.0), (2100.0, 1500.0), (3300.0, 1700.0)]
REQUEST = RouteRequest(region_id="jezero-margin", start=BASE, targets=TARGETS, params=PARAMS)

# Cada perfil sigue sus propios puntos intermedios; las paradas (base y objetivos) son las mismas.
CANDIDATES = {
    RouteProfile.shortest: [BASE, TARGETS[0], TARGETS[1], TARGETS[2]],
    RouteProfile.fastest: [BASE, TARGETS[0], TARGETS[1], (2700.0, 1220.0), TARGETS[2]],
    RouteProfile.safest: [BASE, TARGETS[0], (1450.0, 1350.0), TARGETS[1], (2700.0, 1220.0), TARGETS[2]],
}
STOPS = {
    RouteProfile.shortest: [0, 1, 2, 3],
    RouteProfile.fastest: [0, 1, 2, 4],
    RouteProfile.safest: [0, 1, 3, 5],
}

DISCLAIMER = T(
    es="Planificación conceptual y educativa. No es una ruta certificada para operaciones reales.",
    en="Conceptual, educational planning. Not a route certified for real operations.",
)
W_EXAMPLE = Advisory(code=WarningCode.EXAMPLE_DATA, severity=Severity.info,
                     message=T(es="Datos de ejemplo: terreno sintético, no es un dato de NASA.",
                               en="Example data: synthetic terrain, not NASA data."))
W_CONCEPT = Advisory(code=WarningCode.CONCEPTUAL_ONLY, severity=Severity.info, message=DISCLAIMER)
W_SOFT = Advisory(code=WarningCode.SOFT_SOIL, severity=Severity.caution,
                  message=T(es="La ruta cruza una zona de suelo suelto según la inercia térmica.",
                            en="The route crosses an area of loose soil according to thermal inertia."))


def build_route(p: RouteProfile) -> Route:
    wps = CANDIDATES[p]
    out = segment(wps, STOPS[p])
    back = segment(list(reversed(wps)), [0, len(wps) - 1])
    tot = total(out.metrics, back.metrics)
    warnings = [W_EXAMPLE, W_CONCEPT] + ([W_SOFT] if tot.soft_soil_m > 0 else [])
    cost = CostModel(name={"shortest": "distance", "fastest": "tobler-mars", "safest": "tobler-mars+soft-soil"}[p.value],
                     version=ALGO,
                     parameters={"max_slope_deg": PARAMS.max_slope_deg, "mars_speed_factor": MARS_SPEED_FACTOR,
                                 "soft_soil_penalty": PARAMS.soft_soil_penalty if p == RouteProfile.safest else 0.0})
    return Route(profile=p, outbound=out, return_trip=back, total=tot,
                 within_eva_limit=tot.est_duration_min <= PARAMS.eva_time_limit_min,
                 warnings=warnings, cost_model=cost)


# ---------------------------------------------------------------- regiones
JEZERO_SUMMARY = RegionSummary(
    id="jezero-margin",
    name=T(es="Cráter Jezero — Margin Unit", en="Jezero Crater — Margin Unit"),
    status=RegionStatus.active,
    summary=T(es="La antigua orilla de un lago donde Perseverance halló rastros de tres sistemas de agua distintos.",
              en="The ancient shoreline of a lake where Perseverance found traces of three distinct water systems."),
    center=MarsLocation(lat_deg=18.38, lon_east_deg=77.58, approximate=True),
    thumbnail_url=f"{ASSETS}/jezero-margin/{DATASET}/thumbnail.webp",
)
MEDUSAE_SUMMARY = RegionSummary(
    id="medusae-fossae",
    name=T(es="Medusae Fossae — próxima misión", en="Medusae Fossae — next mission"),
    status=RegionStatus.preview,
    summary=T(es="Depósito ecuatorial que podría guardar hielo bajo cientos de metros de polvo.",
              en="Equatorial deposit that may hold ice beneath hundreds of metres of dust."),
    center=MarsLocation(lat_deg=-2.0, lon_east_deg=190.0, approximate=True),
    thumbnail_url=f"{ASSETS}/medusae-fossae/{DATASET}/thumbnail.webp",
)

JEZERO_FACTS = [
    Fact(text=T(es="La Margin Unit es roca ígnea rica en olivino, no sedimento del lago como se creía desde órbita.",
                en="The Margin Unit is olivine-rich igneous rock, not lake sediment as orbital data suggested."),
         certainty=Certainty.confirmed, sources=[JPL_MARGIN]),
    Fact(text=T(es="Episodio 1: agua subterránea con CO₂ formó crestas de carbonato en las fracturas de las zonas bajas.",
                en="Episode 1: CO₂-rich groundwater formed carbonate ridges in fractures at lower elevations."),
         certainty=Certainty.interpretation, sources=[JPL_MARGIN]),
    Fact(text=T(es="Episodio 2: el lago dejó sílice en las rocas que quedaron bajo la línea de agua.",
                en="Episode 2: the lake left silica in rocks below the water line."),
         certainty=Certainty.interpretation, sources=[JPL_MARGIN]),
    Fact(text=T(es="Episodio 3: agua caliente dejó venas con sulfato de calcio y fluorita en la parte este.",
                en="Episode 3: hot water left veins with calcium sulfate and fluorite in the eastern part."),
         certainty=Certainty.interpretation, sources=[JPL_MARGIN]),
]
MEDUSAE_FACTS = [
    Fact(text=T(es="El radar MARSIS detectó depósitos de hasta 3.7 km de espesor compatibles con capas de hielo.",
                en="MARSIS radar detected deposits up to 3.7 km thick consistent with layered ice."),
         certainty=Certainty.interpretation, sources=[ESA_MFF]),
    Fact(text=T(es="Si fuera hielo y se fundiera, cubriría Marte con 1.5 a 2.7 m de agua.",
                en="If it is ice and melted, it would cover Mars with 1.5 to 2.7 m of water."),
         certainty=Certainty.interpretation, sources=[ESA_MFF]),
    Fact(text=T(es="Estaría bajo una capa seca de varios cientos de metros: inaccesible por décadas.",
                en="It would lie under a dry layer several hundred metres thick: out of reach for decades."),
         certainty=Certainty.interpretation, sources=[ESA_MFF]),
    Fact(text=T(es="Otra interpretación sostiene que es roca volcánica muy porosa, sin hielo.",
                en="Another interpretation holds it is highly porous volcanic rock, without ice."),
         certainty=Certainty.hypothesis, sources=[JHU_VOLC, JPL_MFF_2007]),
    Fact(text=T(es="Es la mayor fuente individual del polvo de Marte.",
                en="It is the largest single source of dust on Mars."),
         certainty=Certainty.confirmed, sources=[JHU_DUST]),
    Fact(text=T(es="Se formó por erupciones volcánicas explosivas hace más de 3,000 millones de años.",
                en="It formed through explosive volcanic eruptions more than 3 billion years ago."),
         certainty=Certainty.interpretation, sources=[JHU_VOLC]),
]


def build_regions():
    zs = [z(x, y) for x in range(0, 4001, 50) for y in range(0, 3001, 50)]
    jezero = RegionDetail(
        **JEZERO_SUMMARY.model_dump(), is_example=True, dataset_version=DATASET,
        coordinate_frame=CoordinateFrame(
            id=FRAME_ID,
            description=T(es="Metros desde la esquina suroeste del recorte: x al este, y al norte, z elevación.",
                          en="Metres from the south-west corner of the crop: x east, y north, z elevation."),
            source_crs=None),
        bounds=BOUNDS, elevation_range=ElevationRange(min_m=round(min(zs), 1), max_m=round(max(zs), 1)),
        mission_objective=T(
            es="Recorrer la Margin Unit desde la base y visitar las rocas de los tres episodios de agua, en orden.",
            en="Walk the Margin Unit from the base and visit the rocks of the three water episodes, in order."),
        facts=JEZERO_FACTS, route_defaults=PARAMS,
        available=Availability(layers=True, pois=True, routes=True, terrain_3d=True))
    medusae = RegionDetail(
        **MEDUSAE_SUMMARY.model_dump(), is_example=True, dataset_version=DATASET,
        coordinate_frame=CoordinateFrame(
            id="medusae-fossae-local-m",
            description=T(es="Sin marco local: región en modo avance.", en="No local frame: preview region."),
            source_crs=None),
        bounds=None, elevation_range=None,
        mission_objective=T(
            es="Próxima misión: estudiar el sitio como posible fuente de agua para una base humana ecuatorial.",
            en="Next mission: study the site as a possible water source for an equatorial human base."),
        facts=MEDUSAE_FACTS, route_defaults=None,
        available=Availability(layers=False, pois=False, routes=False, terrain_3d=False))
    return RegionList(items=[JEZERO_SUMMARY, MEDUSAE_SUMMARY]), jezero, medusae


def tiles(name: str, fmt: str = "xyz") -> TileSource:
    return TileSource(format=fmt, url=f"{ASSETS}/jezero-margin/{DATASET}/{name}/{{z}}/{{x}}/{{y}}.webp",
                      extent=BOUNDS, tile_size=256, min_zoom=0, max_zoom=6)


def build_layers() -> LayerList:
    zs = [z(x, y) for x in range(0, 4001, 50) for y in range(0, 3001, 50)]
    lim_hirise = T(es="Ejemplo: el producto HiRISE real se elige en la spec 002.",
                   en="Example: the real HiRISE product is chosen in spec 002.")
    items = [
        Layer(id="ortho", kind="orthoimage", title=T(es="Imagen orbital", en="Orbital image"),
              description=T(es="Fotografía de alta resolución tomada desde órbita.",
                            en="High-resolution photograph taken from orbit."),
              source=HIRISE, resolution_m=0.25, units=None, legend=None, tiles=tiles("ortho"),
              default_visible=True, default_opacity=1.0, z_order=0, used_in_routing=False, limitations=lim_hirise),
        Layer(id="elevation", kind="elevation", title=T(es="Elevación", en="Elevation"),
              description=T(es="Altura del terreno; base del cálculo de rutas y del terreno 3D.",
                            en="Terrain height; basis for route computation and the 3D terrain."),
              source=HIRISE, resolution_m=1.0, units="m",
              legend=Legend(type="continuous", units="m", stops=[
                  LegendStop(value=round(min(zs), 1), color="#1B3A4B", label=T(es="Más bajo", en="Lowest")),
                  LegendStop(value=round(max(zs), 1), color="#E8D9B5", label=T(es="Más alto", en="Highest"))]),
              tiles=tiles("elevation"), default_visible=False, default_opacity=0.7, z_order=1,
              used_in_routing=True, limitations=lim_hirise),
        Layer(id="hillshade", kind="hillshade", title=T(es="Relieve sombreado", en="Hillshade"),
              description=T(es="Sombras calculadas de la elevación para leer la forma del terreno.",
                            en="Shading computed from elevation to read the shape of the terrain."),
              source=HIRISE, resolution_m=1.0, units=None, legend=None, tiles=tiles("hillshade"),
              default_visible=True, default_opacity=0.5, z_order=2, used_in_routing=False, limitations=lim_hirise),
        Layer(id="thermal-inertia", kind="thermal_inertia", title=T(es="Inercia térmica", en="Thermal inertia"),
              description=T(es="Valores bajos indican polvo o arena suelta; altos, roca firme.",
                            en="Low values indicate dust or loose sand; high values, solid rock."),
              source=THEMIS, resolution_m=100.0, units="J m⁻² K⁻¹ s⁻½",
              legend=Legend(type="continuous", units="J m⁻² K⁻¹ s⁻½", stops=[
                  LegendStop(value=150, color="#C9A66B", label=T(es="Suelo suelto", en="Loose soil")),
                  LegendStop(value=600, color="#3E5C76", label=T(es="Roca firme", en="Solid rock"))]),
              tiles=tiles("thermal-inertia"), default_visible=False, default_opacity=0.6, z_order=3,
              used_in_routing=True,
              limitations=T(es="Píxeles de unos 100 m: identifica zonas, no rocas individuales.",
                            en="Pixels of about 100 m: identifies areas, not individual rocks.")),
        Layer(id="mineralogy", kind="mineralogy", title=T(es="Mineralogía orbital", en="Orbital mineralogy"),
              description=T(es="Minerales detectados desde órbita: compárelos con lo que encontró el rover.",
                            en="Minerals detected from orbit: compare them with what the rover found."),
              source=CRISM, resolution_m=18.0, units=None,
              legend=Legend(type="categorical", units=None, stops=[
                  LegendStop(color="#6FA287", label=T(es="Olivino", en="Olivine")),
                  LegendStop(color="#D0E67A", label=T(es="Carbonato", en="Carbonate"))]),
              tiles=tiles("mineralogy"), default_visible=False, default_opacity=0.6, z_order=4,
              used_in_routing=False,
              limitations=T(es="Detección desde órbita: el rover mostró que su origen era distinto al supuesto.",
                            en="Orbital detection: the rover showed its origin differed from what was assumed.")),
    ]
    return LayerList(region_id="jezero-margin", is_example=True, dataset_version=DATASET, items=items)


def poi(pid, x, y, name, cat, desc, episode=None, evidence=None, images=None, note=None) -> PoiFeature:
    return PoiFeature(id=pid, geometry=PointGeometry(coordinates=(x, y)),
                      properties=PoiProperties(id=pid, name=name, category=cat, description=desc,
                                               water_episode=episode, elevation_m=round(z(x, y), 2),
                                               evidence=evidence or [], images=images or [], confidence_note=note))


def img(name, es, en) -> PoiImage:
    return PoiImage(url=f"{ASSETS}/jezero-margin/{DATASET}/photos/{name}.webp",
                    credit="NASA/JPL-Caltech (imagen real por definir en la spec 002)",
                    caption=T(es=es, en=en))


def build_pois() -> PoiCollection:
    loc_note = T(es="Ubicación de ejemplo: se fija con la travesía de Perseverance en la spec 002.",
                 en="Example location: fixed from Perseverance's traverse in spec 002.")
    feats = [
        poi("base", *BASE, T(es="Base de la misión", en="Mission base"), "base",
            T(es="Punto de salida y regreso de la caminata.", en="Start and return point of the walk."),
            note=loc_note),
        poi("carbonate-ridges", *TARGETS[0], T(es="Crestas de carbonato", en="Carbonate ridges"), "science_target",
            T(es="Episodio 1: agua subterránea con CO₂ precipitó carbonato en las fracturas del olivino.",
              en="Episode 1: CO₂-rich groundwater precipitated carbonate in olivine fractures."),
            1, [JPL_MARGIN], [img("carbonate-ridges", "Crestas de carbonato vistas por el rover.",
                                  "Carbonate ridges seen by the rover.")], loc_note),
        poi("silica-shoreline", *TARGETS[1], T(es="Rocas con sílice bajo la antigua orilla",
                                                 en="Silica-bearing rocks below the old shoreline"), "science_target",
            T(es="Episodio 2: el lago dejó sílice en las rocas que cubría.",
              en="Episode 2: the lake left silica in the rocks it covered."),
            2, [JPL_MARGIN], [img("silica-shoreline", "Roca alterada bajo la línea de agua.",
                                  "Altered rock below the water line.")], loc_note),
        poi("fluorite-veins", *TARGETS[2], T(es="Venas de fluorita", en="Fluorite veins"), "science_target",
            T(es="Episodio 3: agua caliente dejó venas de unos 25 cm con sulfato de calcio y fluorita.",
              en="Episode 3: hot water left veins about 25 cm wide with calcium sulfate and fluorite."),
            3, [JPL_MARGIN], [img("fluorite-veins", "Venas minerales en el sector este.",
                                  "Mineral veins in the eastern sector.")], loc_note),
        poi("upper-olivine", 3500.0, 2600.0, T(es="Olivino intacto en la parte alta", en="Pristine upper olivine"),
            "waypoint", T(es="Roca ígnea casi sin alteración por agua: la referencia de cómo era antes.",
                          en="Igneous rock with almost no water alteration: the reference for how it was before."),
            None, [JPL_MARGIN], [], loc_note),
        poi("loose-soil", SOFT[0], SOFT[1], T(es="Zona de suelo suelto", en="Loose-soil area"), "hazard",
            T(es="Inercia térmica baja: posible arena o polvo donde se camina con dificultad.",
              en="Low thermal inertia: possible sand or dust that is hard to walk on."),
            None, [THEMIS], [], loc_note),
    ]
    return PoiCollection(region_id="jezero-margin", coordinate_frame=FRAME_ID, is_example=True, features=feats)


def build_terrain() -> TerrainManifest:
    zs = [z(x, y) for x in range(0, 4001, 50) for y in range(0, 3001, 50)]
    zmin, zmax = round(min(zs), 1), round(max(zs), 1)
    base = f"{ASSETS}/jezero-margin/{DATASET}/terrain"
    return TerrainManifest(
        region_id="jezero-margin", is_example=True, version=DATASET, coordinate_frame=FRAME_ID, extent=BOUNDS,
        z_min_m=zmin, z_max_m=zmax,
        heightmap=Heightmap(url=f"{base}/heightmap-lod0.png", format="png16", width_px=2001, height_px=1501,
                            meters_per_px=2.0),
        texture=TerrainTexture(url=f"{base}/ortho-4096.webp", format="webp", width_px=4096, height_px=3072,
                               source=HIRISE),
        lods=[TerrainLod(level=0, heightmap_url=f"{base}/heightmap-lod0.png", width_px=2001, height_px=1501,
                         recommended_for="desktop"),
              TerrainLod(level=1, heightmap_url=f"{base}/heightmap-lod1.png", width_px=1001, height_px=751,
                         recommended_for="mobile")],
        vertical_exaggeration_default=1.0,
        scene_transform=SceneTransform(
            units_per_meter=0.01, center_x_m=W / 2, center_y_m=H / 2, z_ref_m=zmin,
            formula=T(es="escena.x = (x − centro_x)·u; escena.y = (z − z_ref)·u·exageración; escena.z = −(y − centro_y)·u",
                      en="scene.x = (x − center_x)·u; scene.y = (z − z_ref)·u·exaggeration; scene.z = −(y − center_y)·u")),
        total_size_bytes=None)


def errors():
    def e(code, es, en, details):
        return ErrorResponse(error=ErrorBody(code=code, message=T(es=es, en=en), details=details))
    return {
        "error-region-not-found.json": e(ErrorCode.REGION_NOT_FOUND, "La región «olympus» no existe.",
                                         "Region 'olympus' does not exist.", {"region_id": "olympus"}),
        "error-region-preview-only.json": e(
            ErrorCode.REGION_PREVIEW_ONLY,
            "Esta región es un avance de la próxima misión: no tiene capas, terreno 3D ni rutas.",
            "This region is a preview of the next mission: it has no layers, 3D terrain or routes.",
            {"region_id": "medusae-fossae"}),
        "error-out-of-bounds.json": e(ErrorCode.OUT_OF_BOUNDS, "Un punto está fuera del área con datos de la región.",
                                      "A point lies outside the region's data coverage.",
                                      {"point": [-50.0, 10.0], "bounds": BOUNDS.model_dump()}),
        "error-no-route.json": e(ErrorCode.NO_ROUTE,
                                 "No existe una ruta que respete la pendiente máxima entre esos puntos.",
                                 "No route respects the maximum slope between those points.",
                                 {"max_slope_deg": 25, "blocked_target_index": 2}),
    }


def main():
    regions, jezero, medusae = build_regions()
    routes = [build_route(p) for p in PARAMS.profiles]
    safest = next(r for r in routes if r.profile == RouteProfile.safest)
    route_resp = RouteResponse(
        region_id="jezero-margin", is_example=True, dataset_version=DATASET, algorithm_version=ALGO,
        coordinate_frame=FRAME_ID, computed_at=NOW, request=REQUEST, params_used=PARAMS, routes=routes,
        comparison=RouteComparison(
            recommended_profile=RouteProfile.safest,
            reason=T(es="Evita el suelo suelto con poco tiempo extra y queda dentro del límite de la EVA.",
                     en="It avoids loose soil for little extra time and stays within the EVA limit.")),
        disclaimer=DISCLAIMER)
    mission_create = MissionCreate(name="EVA Margin Unit 01", route_request=REQUEST,
                                   selected_profile=RouteProfile.safest, crew=["crew-01", "crew-02"])
    mission = Mission(id="example-mission-0001", is_example=True, created_at=NOW, name=mission_create.name,
                      region_id="jezero-margin", selected_profile=RouteProfile.safest, crew=mission_create.crew,
                      params_used=PARAMS, route=safest, dataset_version=DATASET, algorithm_version=ALGO)
    report = MissionReport(
        mission_id=mission.id, is_example=True,
        title=T(es="Informe de misión — EVA Margin Unit 01", en="Mission report — EVA Margin Unit 01"),
        summary=T(es="Caminata de ida y vuelta desde la base por los tres episodios de agua de la Margin Unit.",
                  en="Round-trip walk from the base through the three water episodes of the Margin Unit."),
        metrics=safest.total,
        objectives_visited=[f.properties.name for f in build_pois().features if f.properties.water_episode],
        sources=[JPL_MARGIN, HIRISE, THEMIS, CRISM],
        assumptions=[
            T(es="Velocidad según pendiente: función de Tobler con un factor de 0.8 por el traje (provisional).",
              en="Speed by slope: Tobler's function with a 0.8 suit factor (provisional)."),
            T(es="Pendiente máxima de 25° y límite de EVA de 240 min (provisionales).",
              en="Maximum slope of 25° and EVA limit of 240 min (provisional)."),
        ],
        limitations=[
            T(es="La inercia térmica tiene píxeles de unos 100 m: no detecta rocas individuales.",
              en="Thermal inertia has pixels of about 100 m: it does not detect individual rocks."),
            T(es="No se modelan radiación, energía, comunicaciones ni el clima.",
              en="Radiation, power, communications and weather are not modelled."),
        ],
        disclaimer=DISCLAIMER, generated_at=NOW)
    health = Health(mode="example", app_version=APP_VERSION,
                    dataset_versions={"jezero-margin": DATASET, "medusae-fossae": DATASET},
                    endpoints={e: "example" for e in ALL_ENDPOINTS})

    files = {
        "health.json": health, "regions.json": regions, "region-jezero.json": jezero,
        "region-medusae-fossae.json": medusae, "layers-jezero.json": build_layers(),
        "pois-jezero.json": build_pois(), "terrain-jezero.json": build_terrain(),
        "route-request.json": REQUEST, "route-response.json": route_resp,
        "mission-create.json": mission_create, "mission.json": mission, "mission-report.json": report,
        **errors(),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for name, model in files.items():
        (OUT / name).write_text(json.dumps(model.model_dump(mode="json"), ensure_ascii=False, indent=2) + "\n",
                                encoding="utf-8")
    (REPO / "contracts" / "openapi.json").write_text(
        json.dumps(build_openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    for r in routes:
        print(f"{r.profile.value:9s} ida {r.outbound.metrics.distance_m:8.1f} m  "
              f"{r.outbound.metrics.est_duration_min:5.1f} min  suelo suelto {r.outbound.metrics.soft_soil_m:6.1f} m  "
              f"pend.máx {r.outbound.metrics.max_slope_deg:5.2f}°  total {r.total.est_duration_min:6.1f} min")
    print(f"{len(files)} ejemplos y openapi.json escritos")


if __name__ == "__main__":
    main()
