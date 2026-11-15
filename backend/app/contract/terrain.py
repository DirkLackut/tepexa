"""Manifiesto del terreno 3D (RF-000-05)."""
from typing import Literal

from pydantic import Field

from .common import Bounds, LocalizedText, Model, Source


class Heightmap(Model):
    url: str
    format: Literal["png16"] = Field(description="z = z_min + (valor / 65535) * (z_max - z_min)")
    width_px: int = Field(gt=1)
    height_px: int = Field(gt=1)
    meters_per_px: float = Field(gt=0)
    sha256: str | None = None


class TerrainTexture(Model):
    url: str
    format: Literal["webp", "ktx2", "jpg", "png"]
    width_px: int = Field(gt=0)
    height_px: int = Field(gt=0)
    source: Source
    sha256: str | None = None


class TerrainLod(Model):
    level: int = Field(ge=0, description="0 = mayor detalle")
    heightmap_url: str
    width_px: int
    height_px: int
    recommended_for: Literal["desktop", "mobile", "any"]


class SceneTransform(Model):
    up_axis: Literal["y"] = "y"
    units_per_meter: float = Field(gt=0)
    center_x_m: float
    center_y_m: float
    z_ref_m: float
    formula: LocalizedText


class TerrainManifest(Model):
    region_id: str
    is_example: bool
    version: str
    coordinate_frame: str
    extent: Bounds
    z_min_m: float
    z_max_m: float
    heightmap: Heightmap
    texture: TerrainTexture
    lods: list[TerrainLod]
    vertical_exaggeration_default: float = Field(gt=0)
    scene_transform: SceneTransform
    total_size_bytes: int | None = None
