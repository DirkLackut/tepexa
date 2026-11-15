"""Configuración por variables de entorno (ver .env.example)."""
import os

APP_VERSION = "0.1.0-spec000"


def mode() -> str:
    """Spec 000 solo implementa el modo «example»."""
    return "live" if os.getenv("TEPEXA_MODE", "example") == "live" else "example"


def cors_origins() -> list[str]:
    raw = os.getenv("TEPEXA_CORS_ORIGINS", "http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]
