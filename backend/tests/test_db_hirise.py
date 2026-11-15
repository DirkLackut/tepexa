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


# ---------------------------------------------------------------- spec 004: misiones en vivo
def _mission_body(client):
    pois = {f["id"]: f["geometry"]["coordinates"] for f in client.get("/api/v1/regions/jezero-margin/pois").json()["features"]}
    return {"name": "EVA Margin Unit 01", "selected_profile": "safest", "crew": ["crew-01", "crew-02"],
            "route_request": {"region_id": "jezero-margin", "start": pois["base"],
                              "targets": [pois["pelican-point"], pois["lefroy-bay"], pois["comet-geyser"]], "params": None}}


def test_save_read_and_report_mission(client):
    from app import missions
    missions.reset_rate_limits()
    r = client.post("/api/v1/missions", json=_mission_body(client))
    assert r.status_code == 201, r.text
    m = r.json()
    assert m["id"].startswith("m-") and m["is_example"] is False and m["route"]["profile"] == "safest"
    got = client.get(f"/api/v1/missions/{m['id']}").json()
    assert got["route"] == m["route"] and got["params_used"] == m["params_used"]  # CE-1
    rep = client.get(f"/api/v1/missions/{m['id']}/report").json()
    assert rep["metrics"] == m["route"]["total"]  # CE-2
    assert [o["es"] for o in rep["objectives_visited"]] == ["Pelican Point", "Lefroy Bay", "Comet Geyser"]
    assert rep["sources"] and rep["assumptions"] and rep["limitations"] and rep["disclaimer"]["es"]


def test_mission_ignores_route_sent_by_browser(client):
    body = _mission_body(client)
    body["route"] = {"fake": True}
    r = client.post("/api/v1/missions", json=body)
    assert r.status_code == 422  # el contrato no acepta rutas del navegador (RF-004-01)


def test_unknown_mission_404(client):
    r = client.get("/api/v1/missions/m-noexiste123")
    assert r.status_code == 404 and r.json()["error"]["code"] == "MISSION_NOT_FOUND"


def test_mission_rate_limit_live(client):
    from app import missions
    missions.reset_rate_limits()
    body = _mission_body(client)
    codes = [client.post("/api/v1/missions", json=body, headers={"X-Forwarded-For": "9.9.9.9"}).status_code
             for _ in range(missions.RATE_MAX + 1)]
    assert codes[:-1] == [201] * missions.RATE_MAX and codes[-1] == 429
    missions.reset_rate_limits()
