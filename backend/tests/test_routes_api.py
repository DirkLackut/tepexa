"""Spec 003: POST /routes/compare en modo live, sin base de datos (la región sale de los ejemplos)."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import example_store, repository
from app.contract import RouteResponse
from app.main import app

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"
REQUEST = json.loads((EXAMPLES / "route-request.json").read_text(encoding="utf-8"))


@pytest.fixture()
def live(monkeypatch):
    monkeypatch.setenv("TEPEXA_MODE", "live")
    monkeypatch.setattr(repository, "get_region", example_store.region)
    monkeypatch.setattr(repository, "list_regions", example_store.regions)
    return TestClient(app)


def test_health_reports_routes_live(live):
    assert live.get("/api/v1/health").json()["endpoints"]["routes"] == "live"


def test_compare_computes_on_example_terrain(live):
    r = live.post("/api/v1/routes/compare", json=REQUEST)
    assert r.status_code == 200, r.text
    resp = RouteResponse.model_validate(r.json())
    assert resp.is_example is True
    assert resp.algorithm_version.startswith("routing-")
    assert {x.profile.value for x in resp.routes} == {"shortest", "fastest", "safest"}


def test_compare_with_other_points(live):
    body = {**REQUEST, "start": [500.0, 500.0], "targets": [[3000.0, 2500.0]]}
    r = live.post("/api/v1/routes/compare", json=body)
    assert r.status_code == 200, r.text
    out = r.json()["routes"][0]["outbound"]["polyline"]
    assert out[0][:2] == [500.0, 500.0] and out[-1][:2] == [3000.0, 2500.0]


def test_null_params_use_region_defaults(live):
    r = live.post("/api/v1/routes/compare", json={**REQUEST, "params": None})
    assert r.status_code == 200, r.text
    region = example_store.region("jezero-margin")
    assert r.json()["params_used"] == region.route_defaults.model_dump(mode="json")


def test_no_route_when_slope_limit_is_tiny(live):
    body = {**REQUEST, "params": {**REQUEST["params"], "max_slope_deg": 0.2}}
    r = live.post("/api/v1/routes/compare", json=body)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "NO_ROUTE"


@pytest.mark.parametrize("region_id,status,code", [("olympus", 404, "REGION_NOT_FOUND"),
                                                   ("medusae-fossae", 409, "REGION_PREVIEW_ONLY")])
def test_region_errors(live, region_id, status, code):
    r = live.post("/api/v1/routes/compare", json={**REQUEST, "region_id": region_id})
    assert r.status_code == status and r.json()["error"]["code"] == code


def test_out_of_bounds(live):
    r = live.post("/api/v1/routes/compare", json={**REQUEST, "targets": [[5000.0, 10.0]]})
    assert r.status_code == 422 and r.json()["error"]["code"] == "OUT_OF_BOUNDS"


def test_unknown_walking_model_is_rejected(live):
    body = {**REQUEST, "params": {**REQUEST["params"], "walking_model": "teleport"}}
    r = live.post("/api/v1/routes/compare", json=body)
    assert r.status_code == 422 and r.json()["error"]["code"] == "BAD_REQUEST"


def test_contract_example_is_what_the_engine_computes():
    """D-27: el ejemplo publicado para el frontend coincide con el cálculo real del motor."""
    from app.routing.engine import plan_routes
    from app.routing.synthetic import example_terrain

    example = RouteResponse.model_validate(json.loads((EXAMPLES / "route-response.json").read_text(encoding="utf-8")))
    req = example.request
    routes = plan_routes(example_terrain(), req.start, req.targets, example.params_used)
    for got, want in zip(routes, example.routes):
        assert got.profile == want.profile
        assert [tuple(p) for p in got.outbound.polyline] == [tuple(p) for p in want.outbound.polyline]
        assert got.total == want.total


# ---------------------------------------------------------------- spec 002: terreno real HiRISE
def _real_region():
    return example_store.region("jezero-margin").model_copy(update={"dataset_version": "hirise-v1", "is_example": False})


@pytest.fixture()
def live_real(monkeypatch):
    monkeypatch.setenv("TEPEXA_MODE", "live")
    monkeypatch.setenv("TEPEXA_PUBLIC_URL", "https://api.test")
    monkeypatch.setattr(repository, "get_region", lambda rid: _real_region() if rid == "jezero-margin" else example_store.region(rid))
    monkeypatch.setattr(repository, "list_regions", example_store.regions)
    return TestClient(app)


def test_routes_on_real_hirise_terrain(live_real):
    body = {"region_id": "jezero-margin", "start": [2950.0, 1100.0],
            "targets": [[3444.4, 1289.1], [3239.2, 1601.6], [2123.8, 1786.5], [1358.6, 1720.0]], "params": None}
    r = live_real.post("/api/v1/routes/compare", json=body)
    assert r.status_code == 200, r.text
    resp = RouteResponse.model_validate(r.json())
    assert resp.is_example is False and resp.dataset_version == "hirise-v1"
    for route in resp.routes:
        assert "EXAMPLE_DATA" not in [w.code.value for w in route.warnings]
        assert route.outbound.metrics.max_slope_deg <= resp.params_used.max_slope_deg


def test_real_terrain_heights_match_rover_elevation():
    """Las alturas del DTM coinciden con la elevación que reportó Perseverance (±0.5 m)."""
    from app.routing.provider import terrain_for
    t = terrain_for(_real_region())
    for x, y, rover_z in [(3444.4, 1289.1, -2423.31), (2123.8, 1786.5, -2383.03), (1358.6, 1720.0, -2353.78)]:
        assert abs(t.height_at(x, y) - rover_z) < 1.5  # rejilla de 10 m: tolerancia mayor que en la de 2 m


def test_real_terrain_manifest_and_assets(live_real):
    r = live_real.get("/api/v1/regions/jezero-margin/terrain")
    assert r.status_code == 200, r.text
    m = r.json()
    assert m["is_example"] is False and m["version"] == "hirise-v1"
    assert m["heightmap"]["url"].startswith("https://api.test/assets/terrain/jezero-margin/hirise-v1/")
    for url in [m["heightmap"]["url"], m["texture"]["url"], *[l["heightmap_url"] for l in m["lods"]]]:
        path = url.replace("https://api.test", "")
        got = live_real.get(path)
        assert got.status_code == 200 and len(got.content) > 10_000, path


def test_route_responses_are_gzipped(live):
    r = live.post("/api/v1/routes/compare", json=REQUEST, headers={"Accept-Encoding": "gzip"})
    assert r.status_code == 200 and r.headers.get("content-encoding") == "gzip"


def test_real_layers_and_assets(live_real):
    r = live_real.get("/api/v1/regions/jezero-margin/layers")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["is_example"] is False and [l["id"] for l in body["items"]] == ["hillshade", "elevation"]
    for layer in body["items"]:
        assert layer["tiles"]["format"] == "image"
        got = live_real.get(layer["tiles"]["url"].replace("https://api.test", ""))
        assert got.status_code == 200 and len(got.content) > 5_000


# ---------------------------------------------------------------- spec 004 sin base: informe y límites
def test_mission_report_without_db():
    from app import missions
    from app.contract import MissionCreate, PoiCollection, Source
    from app.routing.provider import terrain_for

    region = _real_region()
    body = MissionCreate(name="EVA 01", route_request={
        "region_id": "jezero-margin", "start": [2950.0, 1100.0],
        "targets": [[3444.4, 1289.1], [3239.2, 1601.6]], "params": None}, selected_profile="safest", crew=["crew-01"])
    t = terrain_for(region)
    m, req = missions.build(body, region, t)
    assert m.id.startswith("m-") and m.is_example is False and m.route.profile.value == "safest"
    pois = PoiCollection(region_id="jezero-margin", coordinate_frame="jezero-margin-local-m", is_example=False, features=[
        {"id": "pelican-point", "geometry": {"coordinates": [3444.4, 1289.1]},
         "properties": {"id": "pelican-point", "name": {"es": "Pelican Point", "en": "Pelican Point"},
                        "category": "science_target", "description": {"es": "x", "en": "x"},
                        "evidence": [], "images": []}}])
    rep = missions.report(m, req.model_dump(mode="json"), region, pois,
                          Source(mission="MRO", url="https://example.org/dtm", attribution="USGS"), False)
    assert [v.es for v in rep.objectives_visited] == ["Pelican Point", "Objetivo 2 (3239, 1602 m)"]
    assert rep.metrics == m.route.total
    assert any("inercia térmica" in l.es for l in rep.limitations)
    assert rep.sources[0].url == "https://example.org/dtm"


def test_mission_rate_limit():
    from app import missions
    from app.errors import ApiError

    missions.reset_rate_limits()
    for k in range(missions.RATE_MAX):
        missions.check_rate("1.2.3.4", now=1000.0 + k)
    with pytest.raises(ApiError) as e:
        missions.check_rate("1.2.3.4", now=1000.0 + missions.RATE_MAX)
    assert e.value.status == 429 and e.value.body.error.code.value == "RATE_LIMITED"
    missions.check_rate("5.6.7.8", now=1000.0)  # otra IP no se ve afectada
    missions.check_rate("1.2.3.4", now=1000.0 + missions.RATE_WINDOW_S + 1)  # pasa la ventana
    missions.reset_rate_limits()
