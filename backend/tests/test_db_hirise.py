"""Spec 002 — catálogo real de Jezero (semilla 002) en modo live. Necesita TEST_DATABASE_URL."""
import os

import pytest

DB_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not DB_URL, reason="TEST_DATABASE_URL no definida")


@pytest.fixture(scope="module")
def db():
    import psycopg

    from db.migrate import apply_migrations, apply_seeds

    with psycopg.connect(DB_URL, autocommit=True) as conn:
        conn.execute("drop schema if exists public cascade")
        conn.execute("create schema public")
    apply_migrations(DB_URL)
    return apply_seeds(DB_URL)  # 001 (ejemplo) y luego 002 (Jezero real)


@pytest.fixture()
def client(db, monkeypatch):
    from fastapi.testclient import TestClient

    from app import db as appdb
    from app.main import app

    monkeypatch.setenv("TEPEXA_MODE", "live")
    monkeypatch.setenv("DATABASE_URL", DB_URL)
    appdb.reset_pool()
    yield TestClient(app)
    appdb.reset_pool()


def test_seeds_in_order(db):
    assert db == ["001_catalogo_ejemplo", "002_jezero_hirise"]


def test_seed_002_is_idempotent(db):
    from db.migrate import apply_seeds

    assert apply_seeds(DB_URL, only=["002_jezero_hirise"]) == ["002_jezero_hirise"]


def test_jezero_is_real_and_medusae_untouched(client):
    j = client.get("/api/v1/regions/jezero-margin").json()
    assert j["is_example"] is False and j["dataset_version"] == "hirise-v1"
    assert j["center"] == {"lat_deg": 18.487, "lon_east_deg": 77.325, "approximate": False}
    m = client.get("/api/v1/regions/medusae-fossae").json()
    assert m["status"] == "preview" and len(m["facts"]) == 6


def test_real_pois(client):
    p = client.get("/api/v1/regions/jezero-margin/pois").json()
    assert p["is_example"] is False
    ids = [f["id"] for f in p["features"]]
    assert ids == ["base", "pelican-point", "lefroy-bay", "comet-geyser", "old-faithful-geyser", "eremita-mesa"]
    for f in p["features"]:
        assert f["properties"]["confidence_note"]["es"]
        assert f["properties"]["evidence"]


def test_mission_on_real_terrain(client):
    pois = {f["id"]: f["geometry"]["coordinates"] for f in client.get("/api/v1/regions/jezero-margin/pois").json()["features"]}
    body = {"region_id": "jezero-margin", "start": pois["base"],
            "targets": [pois[k] for k in ["pelican-point", "lefroy-bay", "comet-geyser", "old-faithful-geyser"]],
            "params": None}
    r = client.post("/api/v1/routes/compare", json=body)
    assert r.status_code == 200, r.text
    resp = r.json()
    assert resp["is_example"] is False and resp["dataset_version"] == "hirise-v1"
    assert all(x["within_eva_limit"] for x in resp["routes"])


def test_real_terrain_manifest(client):
    t = client.get("/api/v1/regions/jezero-margin/terrain").json()
    assert t["is_example"] is False and t["version"] == "hirise-v1"
    assert t["z_min_m"] < t["z_max_m"]
