"""Spec 000 — pruebas del contrato (CE-1 a CE-6)."""
import json
import math
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.contract import (
    ErrorResponse,
    Health,
    LayerList,
    Mission,
    MissionCreate,
    MissionReport,
    PoiCollection,
    RegionDetail,
    RegionList,
    RouteRequest,
    RouteResponse,
    TerrainManifest,
)
from app.main import app
from app.openapi_export import build_openapi

REPO = Path(__file__).resolve().parents[2]
EXAMPLES = REPO / "contracts" / "examples"

EXAMPLE_MODELS = {
    "health.json": Health,
    "regions.json": RegionList,
    "region-jezero.json": RegionDetail,
    "region-medusae-fossae.json": RegionDetail,
    "layers-jezero.json": LayerList,
    "pois-jezero.json": PoiCollection,
    "terrain-jezero.json": TerrainManifest,
    "route-request.json": RouteRequest,
    "route-response.json": RouteResponse,
    "mission-create.json": MissionCreate,
    "mission.json": Mission,
    "mission-report.json": MissionReport,
    "error-region-not-found.json": ErrorResponse,
    "error-region-preview-only.json": ErrorResponse,
    "error-out-of-bounds.json": ErrorResponse,
    "error-no-route.json": ErrorResponse,
}


def load(name):
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))


client = TestClient(app)


# CE-1
@pytest.mark.parametrize("name,model", EXAMPLE_MODELS.items())
def test_examples_validate(name, model):
    model.model_validate(load(name))


def test_no_unlisted_examples():
    on_disk = {p.name for p in EXAMPLES.glob("*.json")}
    assert on_disk == set(EXAMPLE_MODELS), on_disk ^ set(EXAMPLE_MODELS)


# CE-2
def test_openapi_up_to_date():
    committed = json.loads((REPO / "contracts" / "openapi.json").read_text(encoding="utf-8"))
    assert committed == build_openapi(), "Regenera con: python contracts/tools/generar_ejemplos.py"


# CE-3
ENDPOINTS = [
    ("GET", "/api/v1/health", None, 200, Health),
    ("GET", "/api/v1/regions", None, 200, RegionList),
    ("GET", "/api/v1/regions/jezero-margin", None, 200, RegionDetail),
    ("GET", "/api/v1/regions/medusae-fossae", None, 200, RegionDetail),
    ("GET", "/api/v1/regions/jezero-margin/layers", None, 200, LayerList),
    ("GET", "/api/v1/regions/jezero-margin/pois", None, 200, PoiCollection),
    ("GET", "/api/v1/regions/jezero-margin/terrain", None, 200, TerrainManifest),
    ("POST", "/api/v1/routes/compare", "route-request.json", 200, RouteResponse),
    ("POST", "/api/v1/missions", "mission-create.json", 201, Mission),
    ("GET", "/api/v1/missions/example-mission-0001", None, 200, Mission),
    ("GET", "/api/v1/missions/example-mission-0001/report", None, 200, MissionReport),
]


@pytest.mark.parametrize("method,path,body,status,model", ENDPOINTS)
def test_endpoints_example_mode(method, path, body, status, model):
    r = client.request(method, path, json=load(body) if body else None)
    assert r.status_code == status, r.text
    model.model_validate(r.json())


# CE-4
@pytest.mark.parametrize(
    "method,path,body,status,code",
    [
        ("GET", "/api/v1/regions/olympus", None, 404, "REGION_NOT_FOUND"),
        ("GET", "/api/v1/regions/olympus/pois", None, 404, "REGION_NOT_FOUND"),
        ("GET", "/api/v1/regions/medusae-fossae/layers", None, 409, "REGION_PREVIEW_ONLY"),
        ("GET", "/api/v1/regions/medusae-fossae/terrain", None, 409, "REGION_PREVIEW_ONLY"),
        ("POST", "/api/v1/routes/compare", "route-request-medusae", 409, "REGION_PREVIEW_ONLY"),
        ("POST", "/api/v1/routes/compare", "route-request-oob", 422, "OUT_OF_BOUNDS"),
        ("GET", "/api/v1/missions/nope", None, 404, "MISSION_NOT_FOUND"),
        ("POST", "/api/v1/routes/compare", "invalid", 422, "BAD_REQUEST"),
    ],
)
def test_errors(method, path, body, status, code):
    payload = None
    if body == "route-request-medusae":
        payload = {**load("route-request.json"), "region_id": "medusae-fossae"}
    elif body == "route-request-oob":
        payload = {**load("route-request.json"), "start": [-50.0, 10.0]}
    elif body == "invalid":
        payload = {"region_id": "jezero-margin"}
    r = client.request(method, path, json=payload)
    assert r.status_code == status, r.text
    err = ErrorResponse.model_validate(r.json()).error
    assert err.code == code
    assert err.message.es and err.message.en


# CE-5
def _metrics(polyline):
    dist = asc = desc = 0.0
    max_slope = 0.0
    for (x0, y0, z0), (x1, y1, z1) in zip(polyline, polyline[1:]):
        h = math.hypot(x1 - x0, y1 - y0)
        dz = z1 - z0
        dist += math.hypot(h, dz)
        asc += max(dz, 0.0)
        desc += max(-dz, 0.0)
        if h > 0:
            max_slope = max(max_slope, math.degrees(math.atan(abs(dz) / h)))
    return dist, asc, desc, max_slope


def test_route_example_consistency():
    resp = RouteResponse.model_validate(load("route-response.json"))
    assert {r.profile for r in resp.routes} == {"shortest", "fastest", "safest"}
    for route in resp.routes:
        for seg in [route.outbound] + ([route.return_trip] if route.return_trip else []):
            d, a, s, m = _metrics(seg.polyline)
            assert math.isclose(seg.metrics.distance_m, d, rel_tol=0.005)
            assert math.isclose(seg.metrics.ascent_m, a, rel_tol=0.005, abs_tol=0.05)
            assert math.isclose(seg.metrics.descent_m, s, rel_tol=0.005, abs_tol=0.05)
            assert math.isclose(seg.metrics.max_slope_deg, m, abs_tol=0.05)
            assert seg.elevation_profile[0].s_m == 0
            assert math.isclose(seg.elevation_profile[-1].s_m, seg.metrics.distance_m, rel_tol=0.005)
        assert route.within_eva_limit == (route.total.est_duration_min <= resp.params_used.eva_time_limit_min)
    for route in resp.routes:
        assert route.outbound.polyline[0][:2] == list(resp.request.start) or tuple(route.outbound.polyline[0][:2]) == tuple(resp.request.start)


# CE-6
def _walk(node, path="$"):
    if isinstance(node, dict):
        keys = set(node)
        if keys & {"es", "en"}:
            assert keys == {"es", "en"}, f"{path}: texto incompleto {keys}"
            assert node["es"].strip() and node["en"].strip(), f"{path}: texto vacío"
            return
        for k, v in node.items():
            _walk(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            _walk(v, f"{path}[{i}]")


@pytest.mark.parametrize("name", EXAMPLE_MODELS)
def test_localized_text_complete(name):
    _walk(load(name))


def test_responses_marked_as_example():
    for name in ["region-jezero.json", "layers-jezero.json", "pois-jezero.json", "terrain-jezero.json",
                 "route-response.json", "mission.json", "mission-report.json"]:
        assert load(name)["is_example"] is True, name
