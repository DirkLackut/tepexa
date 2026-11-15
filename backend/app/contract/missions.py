"""Misiones e informe (RF-000-07)."""
from datetime import datetime

from pydantic import Field

from .common import LocalizedText, Model, Source
from .routes import Route, RouteParams, RouteProfile, RouteRequest, RouteMetrics


class MissionCreate(Model):
    name: str | None = Field(default=None, max_length=80)
    route_request: RouteRequest
    selected_profile: RouteProfile
    crew: list[str] = Field(default_factory=list, max_length=6, description="Identificadores de avatares (Rive, frontend)")


class Mission(Model):
    id: str
    is_example: bool
    created_at: datetime
    name: str | None
    region_id: str
    selected_profile: RouteProfile
    crew: list[str]
    params_used: RouteParams
    route: Route
    dataset_version: str
    algorithm_version: str


class MissionReport(Model):
    mission_id: str
    is_example: bool
    title: LocalizedText
    summary: LocalizedText
    metrics: RouteMetrics
    objectives_visited: list[LocalizedText]
    sources: list[Source]
    assumptions: list[LocalizedText]
    limitations: list[LocalizedText]
    disclaimer: LocalizedText
    generated_at: datetime
