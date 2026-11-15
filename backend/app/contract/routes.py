"""Comparación de rutas (RF-000-06)."""
from datetime import datetime
from enum import Enum

from pydantic import Field

from .common import Advisory, LocalizedText, Model, Point2D, Point3D


class RouteProfile(str, Enum):
    shortest = "shortest"
    fastest = "fastest"
    safest = "safest"


class RouteParams(Model):
    max_slope_deg: float = Field(gt=0, le=60, description="Pendiente máxima transitable (filtro)")
    eva_time_limit_min: float = Field(gt=0, description="Tiempo máximo de la caminata, ida y vuelta")
    profiles: list[RouteProfile] = Field(min_length=1)
    include_return: bool
    soft_soil_penalty: float = Field(ge=0, description="Peso del suelo suelto (inercia térmica) en el perfil safest")
    walking_model: str = Field(description="Modelo de velocidad según pendiente, p. ej. tobler-mars-v1")


class RouteRequest(Model):
    region_id: str
    start: Point2D = Field(description="Base de partida (x, y) en metros")
    targets: list[Point2D] = Field(min_length=1, max_length=5, description="Objetivos en orden de visita")
    params: RouteParams | None = Field(default=None, description="null = valores por defecto de la región")


class RouteMetrics(Model):
    distance_m: float = Field(ge=0, description="Longitud sobre el terreno (3D)")
    ascent_m: float = Field(ge=0)
    descent_m: float = Field(ge=0)
    max_slope_deg: float = Field(ge=0)
    mean_slope_deg: float = Field(ge=0)
    est_duration_min: float = Field(ge=0)
    soft_soil_m: float = Field(ge=0, description="Distancia sobre suelo suelto")


class RouteLeg(Model):
    from_index: int = Field(ge=0, description="0 = base; 1..n = objetivos")
    to_index: int = Field(ge=0)
    vertex_start: int = Field(ge=0, description="Índice del primer vértice del tramo en la polilínea")
    vertex_end: int = Field(ge=0)
    metrics: RouteMetrics


class ProfilePoint(Model):
    s_m: float = Field(ge=0, description="Distancia recorrida")
    z_m: float
    slope_deg: float


class RouteSegment(Model):
    polyline: list[Point3D] = Field(min_length=2)
    metrics: RouteMetrics
    legs: list[RouteLeg]
    elevation_profile: list[ProfilePoint] = Field(min_length=2)


class CostModel(Model):
    name: str
    version: str
    parameters: dict[str, float]


class Route(Model):
    profile: RouteProfile
    outbound: RouteSegment
    return_trip: RouteSegment | None = None
    total: RouteMetrics
    within_eva_limit: bool
    warnings: list[Advisory]
    cost_model: CostModel


class RouteComparison(Model):
    recommended_profile: RouteProfile | None
    reason: LocalizedText


class RouteResponse(Model):
    region_id: str
    is_example: bool
    dataset_version: str
    algorithm_version: str
    coordinate_frame: str
    computed_at: datetime
    request: RouteRequest
    params_used: RouteParams
    routes: list[Route] = Field(min_length=1)
    comparison: RouteComparison
    disclaimer: LocalizedText
