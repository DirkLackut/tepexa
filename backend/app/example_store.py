"""Modo ejemplo (D-9): la API responde con los archivos de contracts/examples."""
import json
from functools import lru_cache
from pathlib import Path

from .contract import (
    LayerList,
    Mission,
    MissionReport,
    PoiCollection,
    RegionDetail,
    RegionList,
    RouteResponse,
    TerrainManifest,
)

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"

REGION_FILES = {
    "jezero-margin": "region-jezero.json",
    "medusae-fossae": "region-medusae-fossae.json",
}
EXAMPLE_MISSION_ID = "example-mission-0001"


def _load(name: str) -> dict:
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))


@lru_cache
def regions() -> RegionList:
    return RegionList.model_validate(_load("regions.json"))


@lru_cache
def region(region_id: str) -> RegionDetail | None:
    name = REGION_FILES.get(region_id)
    return RegionDetail.model_validate(_load(name)) if name else None


@lru_cache
def layers(region_id: str) -> LayerList:
    return LayerList.model_validate(_load("layers-jezero.json"))


@lru_cache
def pois(region_id: str) -> PoiCollection:
    return PoiCollection.model_validate(_load("pois-jezero.json"))


@lru_cache
def terrain(region_id: str) -> TerrainManifest:
    return TerrainManifest.model_validate(_load("terrain-jezero.json"))


@lru_cache
def route_response() -> RouteResponse:
    return RouteResponse.model_validate(_load("route-response.json"))


@lru_cache
def mission() -> Mission:
    return Mission.model_validate(_load("mission.json"))


@lru_cache
def mission_report() -> MissionReport:
    return MissionReport.model_validate(_load("mission-report.json"))
