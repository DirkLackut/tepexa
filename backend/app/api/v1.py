"""Endpoints /api/v1. Modo ejemplo (spec 000) y modo live por endpoint (spec 001)."""
from fastapi import APIRouter

from .. import example_store as store
from .. import repository, terrain_store
from ..contract import (
    ErrorResponse,
    Health,
    LayerList,
    Mission,
    MissionCreate,
    MissionReport,
    PoiCollection,
    RegionDetail,
    RegionList,
    RegionStatus,
    RouteRequest,
    RouteResponse,
    TerrainManifest,
)
from ..errors import dataset_unavailable, mission_not_found, out_of_bounds, region_not_found, region_preview_only
from ..routing import engine, provider
from ..settings import APP_VERSION, endpoint_modes, is_live, mode

router = APIRouter(prefix="/api/v1")

E404 = {404: {"model": ErrorResponse, "description": "No existe"}}
E409 = {409: {"model": ErrorResponse, "description": "Región en modo avance (preview)"}}
E422 = {422: {"model": ErrorResponse, "description": "Petición inválida, fuera de cobertura o sin ruta"}}


def _region(region_id: str) -> RegionDetail:
    r = repository.get_region(region_id) if is_live("region") else store.region(region_id)
    if r is None:
        raise region_not_found(region_id)
    return r


def _active_region(region_id: str) -> RegionDetail:
    r = _region(region_id)
    if r.status != RegionStatus.active:
        raise region_preview_only(region_id)
    return r


def _check_points(req: RouteRequest, region: RegionDetail) -> None:
    b = region.bounds
    for p in [req.start, *req.targets]:
        if not (b.min_x <= p[0] <= b.max_x and b.min_y <= p[1] <= b.max_y):
            raise out_of_bounds(p, b)


@router.get("/health", response_model=Health, tags=["sistema"])
def health() -> Health:
    regions = list_regions().items
    return Health(mode=mode(), app_version=APP_VERSION, endpoints=endpoint_modes(),
                  dataset_versions={r.id: _region(r.id).dataset_version for r in regions})


@router.get("/regions", response_model=RegionList, tags=["regiones"])
def list_regions() -> RegionList:
    return repository.list_regions() if is_live("regions") else store.regions()


@router.get("/regions/{region_id}", response_model=RegionDetail, responses=E404, tags=["regiones"])
def get_region(region_id: str) -> RegionDetail:
    return _region(region_id)


@router.get("/regions/{region_id}/layers", response_model=LayerList, responses={**E404, **E409}, tags=["regiones"])
def get_layers(region_id: str) -> LayerList:
    _active_region(region_id)
    return store.layers(region_id)


@router.get("/regions/{region_id}/pois", response_model=PoiCollection, responses=E404, tags=["regiones"])
def get_pois(region_id: str) -> PoiCollection:
    region = _region(region_id)
    if region.status != RegionStatus.active:
        return PoiCollection(region_id=region_id, coordinate_frame=region.coordinate_frame.id,
                             is_example=region.is_example, features=[])
    return repository.get_pois(region) if is_live("pois") else store.pois(region_id)


@router.get("/regions/{region_id}/terrain", response_model=TerrainManifest, responses={**E404, **E409}, tags=["regiones"])
def get_terrain(region_id: str) -> TerrainManifest:
    region = _active_region(region_id)
    if not is_live("terrain") or region.is_example:
        return store.terrain(region_id)
    m = terrain_store.manifest(region.id, region.dataset_version, region.coordinate_frame.id)
    if m is None:
        raise dataset_unavailable()
    return m


@router.post("/routes/compare", response_model=RouteResponse, responses={**E404, **E409, **E422}, tags=["rutas"])
def compare_routes(req: RouteRequest) -> RouteResponse:
    region = _active_region(req.region_id)
    _check_points(req, region)
    if not is_live("routes"):
        return store.route_response()
    params = req.params or region.route_defaults
    if params is None:
        raise dataset_unavailable()
    return engine.compare(provider.terrain_for(region), req, params, region.coordinate_frame.id)


@router.post("/missions", response_model=Mission, status_code=201, responses={**E404, **E409, **E422}, tags=["misiones"])
def create_mission(body: MissionCreate) -> Mission:
    _check_points(body.route_request, _active_region(body.route_request.region_id))
    return store.mission()


@router.get("/missions/{mission_id}", response_model=Mission, responses=E404, tags=["misiones"])
def get_mission(mission_id: str) -> Mission:
    if mission_id != store.EXAMPLE_MISSION_ID:
        raise mission_not_found(mission_id)
    return store.mission()


@router.get("/missions/{mission_id}/report", response_model=MissionReport, responses=E404, tags=["misiones"])
def get_mission_report(mission_id: str) -> MissionReport:
    if mission_id != store.EXAMPLE_MISSION_ID:
        raise mission_not_found(mission_id)
    return store.mission_report()
