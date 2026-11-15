"""Regiones (RF-000-01, RF-000-02)."""
from enum import Enum

from pydantic import Field

from .common import Bounds, Certainty, CoordinateFrame, LocalizedText, Model, Source
from .routes import RouteParams


class RegionStatus(str, Enum):
    active = "active"
    preview = "preview"


class MarsLocation(Model):
    """Centro de la región para el globo: latitud planetocéntrica y longitud este."""

    lat_deg: float = Field(ge=-90, le=90)
    lon_east_deg: float = Field(ge=0, lt=360)
    approximate: bool


class RegionSummary(Model):
    id: str
    name: LocalizedText
    status: RegionStatus
    summary: LocalizedText
    center: MarsLocation
    thumbnail_url: str | None = None


class RegionList(Model):
    items: list[RegionSummary]


class Fact(Model):
    text: LocalizedText
    certainty: Certainty
    sources: list[Source] = Field(min_length=1)


class ElevationRange(Model):
    min_m: float
    max_m: float


class Availability(Model):
    layers: bool
    pois: bool
    routes: bool
    terrain_3d: bool


class RegionDetail(RegionSummary):
    is_example: bool
    dataset_version: str
    coordinate_frame: CoordinateFrame
    bounds: Bounds | None = Field(default=None, description="Límites del recorte en metros; null en regiones preview")
    elevation_range: ElevationRange | None = None
    mission_objective: LocalizedText
    facts: list[Fact]
    route_defaults: RouteParams | None = Field(default=None, description="null si la región no calcula rutas")
    available: Availability
