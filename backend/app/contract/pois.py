"""Puntos de interés como GeoJSON en el marco local (RF-000-04)."""
from enum import Enum
from typing import Literal

from pydantic import Field

from .common import LocalizedText, Model, Point2D, Source


class PoiCategory(str, Enum):
    base = "base"
    science_target = "science_target"
    hazard = "hazard"
    waypoint = "waypoint"


class PoiImage(Model):
    url: str
    credit: str
    caption: LocalizedText


class PoiProperties(Model):
    id: str
    name: LocalizedText
    category: PoiCategory
    description: LocalizedText
    water_episode: int | None = Field(default=None, ge=1, le=3, description="Episodio de agua de la Margin Unit (1, 2 o 3)")
    elevation_m: float | None = None
    evidence: list[Source]
    images: list[PoiImage]
    confidence_note: LocalizedText | None = None


class PointGeometry(Model):
    type: Literal["Point"] = "Point"
    coordinates: Point2D


class PoiFeature(Model):
    type: Literal["Feature"] = "Feature"
    id: str
    geometry: PointGeometry
    properties: PoiProperties


class PoiCollection(Model):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    region_id: str
    coordinate_frame: str
    is_example: bool
    features: list[PoiFeature]
