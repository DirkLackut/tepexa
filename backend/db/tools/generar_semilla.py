"""Genera backend/db/seeds/001_catalogo_ejemplo.sql desde contracts/examples/ (D-17).

La semilla es idempotente: borra las regiones del catálogo (y en cascada sus hechos y puntos de
interés) y las vuelve a insertar dentro de una transacción.

Uso: python backend/db/tools/generar_semilla.py
"""
import hashlib
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
EXAMPLES = REPO / "contracts" / "examples"
OUT = REPO / "backend" / "db" / "seeds" / "001_catalogo_ejemplo.sql"


def load(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))


def q(v) -> str:
    """Literal SQL seguro para valores generados por nosotros."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, (dict, list)):
        return q(json.dumps(v, ensure_ascii=False, separators=(",", ":"))) + "::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def source_id(src: dict) -> str:
    key = json.dumps(src, sort_keys=True, ensure_ascii=False)
    return "src-" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]


def main():
    regions = [load("region-jezero.json"), load("region-medusae-fossae.json")]
    order = [r["id"] for r in load("regions.json")["items"]]
    pois = load("pois-jezero.json")

    sources: dict[str, dict] = {}

    def src(s):
        sid = source_id(s)
        sources[sid] = s
        return sid

    body = []
    ids = ", ".join(q(r["id"]) for r in regions)
    body.append(f"delete from regions where id in ({ids});")

    facts_sql = []
    for r in regions:
        b = r["bounds"] or {}
        e = r["elevation_range"] or {}
        a = r["available"]
        body.append(
            "insert into regions (id, display_order, status, is_example, dataset_version, name, summary, "
            "center_lat_deg, center_lon_east_deg, center_approximate, thumbnail_url, frame_id, frame_description, "
            "source_crs, min_x, min_y, max_x, max_y, elevation_min_m, elevation_max_m, mission_objective, "
            "route_defaults, available_layers, available_pois, available_routes, available_terrain_3d) values ("
            + ", ".join([
                q(r["id"]), q(order.index(r["id"])), q(r["status"]), q(r["is_example"]), q(r["dataset_version"]),
                q(r["name"]), q(r["summary"]), q(r["center"]["lat_deg"]), q(r["center"]["lon_east_deg"]),
                q(r["center"]["approximate"]), q(r["thumbnail_url"]), q(r["coordinate_frame"]["id"]),
                q(r["coordinate_frame"]["description"]), q(r["coordinate_frame"]["source_crs"]),
                q(b.get("min_x")), q(b.get("min_y")), q(b.get("max_x")), q(b.get("max_y")),
                q(e.get("min_m")), q(e.get("max_m")), q(r["mission_objective"]), q(r["route_defaults"]),
                q(a["layers"]), q(a["pois"]), q(a["routes"]), q(a["terrain_3d"]),
            ]) + ");")
        for i, f in enumerate(r["facts"]):
            facts_sql.append(f"insert into region_facts (region_id, ord, text, certainty) values "
                             f"({q(r['id'])}, {i}, {q(f['text'])}, {q(f['certainty'])});")
            for j, s in enumerate(f["sources"]):
                facts_sql.append(f"insert into region_fact_sources (region_id, fact_ord, ord, source_id) values "
                                 f"({q(r['id'])}, {i}, {j}, {q(src(s))});")

    pois_sql = []
    for k, feat in enumerate(pois["features"]):
        p = feat["properties"]
        x, y = feat["geometry"]["coordinates"]
        pois_sql.append(
            "insert into pois (region_id, id, ord, geom, name, category, description, water_episode, elevation_m, "
            "confidence_note, is_example) values ("
            + ", ".join([q(pois["region_id"]), q(feat["id"]), q(k), f"ST_SetSRID(ST_MakePoint({x!r}, {y!r}), 0)",
                         q(p["name"]), q(p["category"]), q(p["description"]), q(p["water_episode"]),
                         q(p["elevation_m"]), q(p["confidence_note"]), q(pois["is_example"])]) + ");")
        for j, s in enumerate(p["evidence"]):
            pois_sql.append(f"insert into poi_sources (region_id, poi_id, ord, source_id) values "
                            f"({q(pois['region_id'])}, {q(feat['id'])}, {j}, {q(src(s))});")
        for j, im in enumerate(p["images"]):
            pois_sql.append(f"insert into poi_images (region_id, poi_id, ord, url, credit, caption) values "
                            f"({q(pois['region_id'])}, {q(feat['id'])}, {j}, {q(im['url'])}, {q(im['credit'])}, "
                            f"{q(im['caption'])});")

    sources_sql = [
        "insert into sources (id, mission, instrument, product_id, url, attribution, license_note) values ("
        + ", ".join(q(v) for v in [sid, s["mission"], s.get("instrument"), s.get("product_id"), s["url"],
                                   s["attribution"], s.get("license_note")])
        + ") on conflict (id) do update set mission = excluded.mission, instrument = excluded.instrument, "
          "product_id = excluded.product_id, url = excluded.url, attribution = excluded.attribution, "
          "license_note = excluded.license_note;"
        for sid, s in sorted(sources.items())
    ]

    sql = "\n".join([
        "-- Spec 001 · Semilla del catálogo de EJEMPLO (generada; no editar a mano).",
        "-- Generada por backend/db/tools/generar_semilla.py desde contracts/examples/.",
        "-- Idempotente: se puede ejecutar varias veces. En Neon: pegar completo en el SQL Editor.",
        "begin;",
        *sources_sql, *body, *facts_sql, *pois_sql,
        "commit;", "",
    ])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(sql, encoding="utf-8")
    print(f"{OUT.relative_to(REPO)}: {len(sources)} fuentes, {len(regions)} regiones, {len(pois['features'])} puntos")


if __name__ == "__main__":
    main()
