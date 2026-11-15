"""Configuración por variables de entorno (ver .env.example)."""
import os

APP_VERSION = "0.5.0-spec004"

# Endpoints que ya leen datos reales en modo «live» (D-15). El resto sigue en ejemplo.
LIVE_ENDPOINTS = {"regions", "region", "pois", "routes", "terrain", "missions", "layers"}  # 003, 002, 004
ALL_ENDPOINTS = ["regions", "region", "pois", "layers", "terrain", "routes", "missions"]


def mode() -> str:
    return "live" if os.getenv("TEPEXA_MODE", "example") == "live" else "example"


def is_live(endpoint: str) -> bool:
    return mode() == "live" and endpoint in LIVE_ENDPOINTS


def endpoint_modes() -> dict[str, str]:
    return {e: ("live" if is_live(e) else "example") for e in ALL_ENDPOINTS}


def cors_origins() -> list[str]:
    raw = os.getenv("TEPEXA_CORS_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


def cors_origin_regex() -> str | None:
    """Para las vistas previas de Vercel, p. ej. ^https://tepexa-.*\\.vercel\\.app$ (D-19)."""
    return os.getenv("TEPEXA_CORS_ORIGIN_REGEX") or None
