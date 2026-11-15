"""Genera el OpenAPI del contrato de forma determinista (CE-2)."""
import json

from .main import app


def build_openapi() -> dict:
    app.openapi_schema = None
    return json.loads(json.dumps(app.openapi(), sort_keys=True))
