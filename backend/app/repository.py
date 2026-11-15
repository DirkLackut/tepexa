"""Lectura del catálogo desde la base (spec 001)."""
from .contract import PoiCollection, RegionDetail, RegionList
from .db import connection

_SOURCE_COLS = "s.mission, s.instrument, s.product_id, s.url, s.attribution, s.license_note"


def _source(row: dict) -> dict:
    return {k: row[k] for k in ("mission", "instrument", "product_id", "url", "attribution", "license_note")}


def _summary(r: dict) -> dict:
    return {
        "id": r["id"], "name": r["name"], "status": r["status"], "summary": r["summary"],
        "center": {"lat_deg": r["center_lat_deg"], "lon_east_deg": r["center_lon_east_deg"],
                   "approximate": r["center_approximate"]},
        "thumbnail_url": r["thumbnail_url"],
    }


def list_regions() -> RegionList:
    with connection() as conn:
        rows = conn.execute("select * from regions order by display_order").fetchall()
    return RegionList(items=[_summary(r) for r in rows])


def get_region(region_id: str) -> RegionDetail | None:
    with connection() as conn:
        r = conn.execute("select * from regions where id = %s", (region_id,)).fetchone()
        if r is None:
            return None
        facts = conn.execute("select ord, text, certainty from region_facts where region_id = %s order by ord",
                             (region_id,)).fetchall()
        srcs = conn.execute(
            f"select fs.fact_ord, {_SOURCE_COLS} from region_fact_sources fs join sources s on s.id = fs.source_id"
            " where fs.region_id = %s order by fs.fact_ord, fs.ord", (region_id,)).fetchall()
    by_fact: dict[int, list] = {}
    for s in srcs:
        by_fact.setdefault(s["fact_ord"], []).append(_source(s))
    bounds = None
    if r["min_x"] is not None:
        bounds = {"min_x": r["min_x"], "min_y": r["min_y"], "max_x": r["max_x"], "max_y": r["max_y"]}
    elevation = None
    if r["elevation_min_m"] is not None:
        elevation = {"min_m": r["elevation_min_m"], "max_m": r["elevation_max_m"]}
    return RegionDetail(
        **_summary(r), is_example=r["is_example"], dataset_version=r["dataset_version"],
        coordinate_frame={"id": r["frame_id"], "units": "m", "description": r["frame_description"],
                          "source_crs": r["source_crs"]},
        bounds=bounds, elevation_range=elevation, mission_objective=r["mission_objective"],
        facts=[{"text": f["text"], "certainty": f["certainty"], "sources": by_fact.get(f["ord"], [])} for f in facts],
        route_defaults=r["route_defaults"],
        available={"layers": r["available_layers"], "pois": r["available_pois"], "routes": r["available_routes"],
                   "terrain_3d": r["available_terrain_3d"]},
    )


def get_pois(region: RegionDetail) -> PoiCollection:
    with connection() as conn:
        rows = conn.execute(
            "select id, ST_X(geom) as x, ST_Y(geom) as y, name, category, description, water_episode,"
            " elevation_m, confidence_note, is_example from pois where region_id = %s order by ord",
            (region.id,)).fetchall()
        srcs = conn.execute(
            f"select ps.poi_id, {_SOURCE_COLS} from poi_sources ps join sources s on s.id = ps.source_id"
            " where ps.region_id = %s order by ps.poi_id, ps.ord", (region.id,)).fetchall()
        imgs = conn.execute("select poi_id, url, credit, caption from poi_images where region_id = %s"
                            " order by poi_id, ord", (region.id,)).fetchall()
    evidence: dict[str, list] = {}
    for s in srcs:
        evidence.setdefault(s["poi_id"], []).append(_source(s))
    images: dict[str, list] = {}
    for i in imgs:
        images.setdefault(i["poi_id"], []).append({"url": i["url"], "credit": i["credit"], "caption": i["caption"]})
    features = [{
        "type": "Feature", "id": p["id"],
        "geometry": {"type": "Point", "coordinates": (p["x"], p["y"])},
        "properties": {
            "id": p["id"], "name": p["name"], "category": p["category"], "description": p["description"],
            "water_episode": p["water_episode"], "elevation_m": p["elevation_m"],
            "evidence": evidence.get(p["id"], []), "images": images.get(p["id"], []),
            "confidence_note": p["confidence_note"],
        },
    } for p in rows]
    is_example = any(p["is_example"] for p in rows) if rows else region.is_example
    return PoiCollection(region_id=region.id, coordinate_frame=region.coordinate_frame.id,
                         is_example=is_example, features=features)
