"""Spec 001 — base de datos y catálogo (CE-1 a CE-5).

Necesita TEST_DATABASE_URL apuntando a un PostgreSQL con PostGIS que se puede vaciar.
Sin esa variable, estas pruebas se saltan.
"""
import json
import os
from pathlib import Path

import pytest

DB_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not DB_URL, reason="TEST_DATABASE_URL no definida")

REPO = Path(__file__).resolve().parents[2]
EXAMPLES = REPO / "contracts" / "examples"


def load(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def db():
    import psycopg

    from db.migrate import apply_migrations, apply_seeds

    with psycopg.connect(DB_URL, autocommit=True) as conn:
        conn.execute("drop schema if exists public cascade")
        conn.execute("create schema public")
    applied = apply_migrations(DB_URL)
    apply_seeds(DB_URL, only=["001_catalogo_ejemplo"])  # el catálogo real (002) se prueba en test_db_hirise.py
    return applied


@pytest.fixture()
def live_client(db, monkeypatch):
    from fastapi.testclient import TestClient

    from app import db as appdb
    from app.main import app

    monkeypatch.setenv("TEPEXA_MODE", "live")
    monkeypatch.setenv("DATABASE_URL", DB_URL)
    appdb.reset_pool()
    yield TestClient(app)
    appdb.reset_pool()


# CE-1
def test_migrations_apply(db):
    import psycopg

    assert db, "no se aplicó ninguna migración"
    with psycopg.connect(DB_URL) as conn:
        versions = [r[0] for r in conn.execute("select version from schema_migrations order by version")]
        assert versions == sorted(p.stem for p in (REPO / "backend" / "db" / "migrations").glob("*.sql"))
        assert conn.execute("select postgis_version()").fetchone()[0]
        srid = conn.execute("select Find_SRID('public', 'pois', 'geom')").fetchone()[0]
        assert srid == 0


def test_migrations_are_not_reapplied(db):
    from db.migrate import apply_migrations

    assert apply_migrations(DB_URL) == []


# CE-2
@pytest.mark.parametrize("bad", ['{"es": "hola"}', '{"es": "hola", "en": " "}', '{"es": "a", "en": "b", "fr": "c"}', '"texto"'])
def test_localized_check(db, bad):
    import psycopg

    with psycopg.connect(DB_URL) as conn:
        with pytest.raises(psycopg.errors.CheckViolation):
            conn.execute(
                "insert into sources (id, mission, url, attribution) values ('x', 'm', 'u', 'a');"
                "insert into regions (id, display_order, status, is_example, dataset_version, name, summary,"
                " center_lat_deg, center_lon_east_deg, center_approximate, frame_id, frame_description,"
                " mission_objective, available_layers, available_pois, available_routes, available_terrain_3d)"
                f" values ('bad', 99, 'preview', true, 'v', '{bad}', '{{\"es\":\"a\",\"en\":\"b\"}}', 0, 0, true,"
                " 'bad-frame', '{\"es\":\"a\",\"en\":\"b\"}', '{\"es\":\"a\",\"en\":\"b\"}', false, false, false, false)"
            )
        conn.rollback()


def test_seed_is_idempotent(db):
    import psycopg

    from db.migrate import apply_seeds

    apply_seeds(DB_URL, only=["001_catalogo_ejemplo"])
    with psycopg.connect(DB_URL) as conn:
        assert conn.execute("select count(*) from regions").fetchone()[0] == 2
        assert conn.execute("select count(*) from pois").fetchone()[0] == len(load("pois-jezero.json")["features"])


def test_pois_inside_region_bounds(db):
    import psycopg

    with psycopg.connect(DB_URL) as conn:
        outside = conn.execute(
            "select p.id from pois p join regions r on r.id = p.region_id"
            " where not ST_Covers(ST_MakeEnvelope(r.min_x, r.min_y, r.max_x, r.max_y, 0), p.geom)"
        ).fetchall()
        assert outside == []


# CE-3
@pytest.mark.parametrize(
    "path,example",
    [
        ("/api/v1/regions", "regions.json"),
        ("/api/v1/regions/jezero-margin", "region-jezero.json"),
        ("/api/v1/regions/medusae-fossae", "region-medusae-fossae.json"),
        ("/api/v1/regions/jezero-margin/pois", "pois-jezero.json"),
    ],
)
def test_live_matches_contract(live_client, path, example):
    r = live_client.get(path)
    assert r.status_code == 200, r.text
    assert r.json() == load(example)


def test_live_not_found(live_client):
    r = live_client.get("/api/v1/regions/olympus")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "REGION_NOT_FOUND"


def test_live_preview_pois_empty(live_client):
    r = live_client.get("/api/v1/regions/medusae-fossae/pois")
    assert r.status_code == 200
    assert r.json()["features"] == []


# CE-4
def test_health_endpoints_status(live_client):
    h = live_client.get("/api/v1/health").json()
    assert h["mode"] == "live"
    assert h["endpoints"]["regions"] == "live"
    assert h["endpoints"]["region"] == "live"
    assert h["endpoints"]["pois"] == "live"
    assert h["endpoints"]["routes"] == "live"
    assert h["endpoints"]["terrain"] == "live"
    for name in ["layers", "missions"]:
        assert h["endpoints"][name] == "example"
    assert live_client.get("/api/v1/regions/jezero-margin/layers").json()["is_example"] is True


# CE-5
def test_db_unavailable(monkeypatch):
    from fastapi.testclient import TestClient

    from app import db as appdb
    from app.main import app

    monkeypatch.setenv("TEPEXA_MODE", "live")
    monkeypatch.setenv("DATABASE_URL", "postgresql://nadie@127.0.0.1:1/nada?connect_timeout=1")
    appdb.reset_pool()
    try:
        r = TestClient(app).get("/api/v1/regions")
        assert r.status_code == 503
        body = r.json()["error"]
        assert body["code"] == "DATASET_UNAVAILABLE"
        assert "127.0.0.1" not in json.dumps(body)
    finally:
        appdb.reset_pool()
