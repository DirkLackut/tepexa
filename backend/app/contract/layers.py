"""Capas científicas (RF-000-03)."""
from enum import Enum
from typing import Literal

from pydantic import Field

from .common import Bounds, LocalizedText, Model, Source


class LayerKind(str, Enum):
    orthoimage = "orthoimage"
    elevation = "elevation"
    hillshade = "hillshade"
    thermal_inertia = "thermal_inertia"
    mineralogy = "mineralogy"
    geology = "geology"


class LegendStop(Model):
    value: float | None = Field(default=None, description="Valor numérico (continua) o null (categórica)")
    color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    label: "LocalizedText"


class Legend(Model):
    type: Literal["continuous", "categorical"]
    units: str | None = None
    stops: list[LegendStop] = Field(min_length=2)


class TileSource(Model):
    format: Literal["xyz", "pmtiles", "cog", "image"]
    url: str = Field(description="URL o plantilla {z}/{x}/{y}")
    extent: Bounds
    tile_size: int | None = None
    min_zoom: int | None = None
    max_zoom: int | None = None


class Layer(Model):
    id: str
    kind: LayerKind
    title: LocalizedText
    description: LocalizedText
    source: Source
    resolution_m: float = Field(gt=0)
    units: str | None = None
    legend: Legend | None = None
    tiles: TileSource
    default_visible: bool
    default_opacity: float = Field(ge=0, le=1)
    z_order: int
    used_in_routing: bool
    limitations: LocalizedText


class LayerList(Model):
    region_id: str
    is_example: bool
    dataset_version: str
    items: list[Layer]
