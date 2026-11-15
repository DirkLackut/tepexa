"""Tipos comunes del contrato (spec 000)."""
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LocalizedText(Model):
    """Texto para el usuario en los dos idiomas de la app."""

    es: Annotated[str, Field(min_length=1)]
    en: Annotated[str, Field(min_length=1)]


Point2D = tuple[float, float]
"""Punto (x, y) en metros en el marco local de la región."""

Point3D = tuple[float, float, float]
"""Punto (x, y, z) en metros: z es la elevación respecto al datum del DEM."""


class Bounds(Model):
    min_x: float
    min_y: float
    max_x: float
    max_y: float


class CoordinateFrame(Model):
    id: str = Field(description="Identificador del marco local, p. ej. jezero-margin-local-m")
    units: Literal["m"] = "m"
    description: LocalizedText
    source_crs: str | None = Field(default=None, description="Proyección marciana de origen; se fija en la spec 002")


class Source(Model):
    """Procedencia de un dato (constitución, principio 1)."""

    mission: str
    instrument: str | None = None
    product_id: str | None = None
    url: str
    attribution: str
    license_note: str | None = None


class Certainty(str, Enum):
    confirmed = "confirmed"
    interpretation = "interpretation"
    hypothesis = "hypothesis"


class WarningCode(str, Enum):
    EXAMPLE_DATA = "EXAMPLE_DATA"
    STEEP_SEGMENT = "STEEP_SEGMENT"
    SOFT_SOIL = "SOFT_SOIL"
    EVA_LIMIT_EXCEEDED = "EVA_LIMIT_EXCEEDED"
    LOW_DATA_RESOLUTION = "LOW_DATA_RESOLUTION"
    CONCEPTUAL_ONLY = "CONCEPTUAL_ONLY"


class Severity(str, Enum):
    info = "info"
    caution = "caution"
    critical = "critical"


class Advisory(Model):
    code: WarningCode
    severity: Severity
    message: LocalizedText


class ErrorCode(str, Enum):
    BAD_REQUEST = "BAD_REQUEST"
    REGION_NOT_FOUND = "REGION_NOT_FOUND"
    REGION_PREVIEW_ONLY = "REGION_PREVIEW_ONLY"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"
    NODATA = "NODATA"
    NO_ROUTE = "NO_ROUTE"
    MISSION_NOT_FOUND = "MISSION_NOT_FOUND"
    DATASET_UNAVAILABLE = "DATASET_UNAVAILABLE"
    INTERNAL = "INTERNAL"


class ErrorBody(Model):
    code: ErrorCode
    message: LocalizedText
    details: dict | None = None


class ErrorResponse(Model):
    error: ErrorBody


class Health(Model):
    status: Literal["ok"] = "ok"
    api_version: Literal["v1"] = "v1"
    mode: Literal["example", "live"]
    app_version: str
    dataset_versions: dict[str, str]
    endpoints: dict[str, Literal["live", "example"]] = Field(
        default_factory=dict, description="Por endpoint: si ya responde con datos reales (live) o de ejemplo (spec 001)")
