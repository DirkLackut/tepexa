"""API de TEPEXA."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import errors
from .api.v1 import router
from .settings import APP_VERSION, cors_origins

app = FastAPI(
    title="TEPEXA API",
    version=APP_VERSION,
    summary="Explore the Unknown — mapa, rutas y simulación de EVA en Marte (NASA Space Apps 2026).",
    description=(
        "Contrato definido en la spec 000. Todas las coordenadas están en metros en el marco local "
        "de cada región. Los textos para el usuario vienen como {es, en}. Las respuestas de ejemplo "
        "llevan is_example: true y no son datos de NASA."
    ),
)
errors.install(app)
app.add_middleware(CORSMiddleware, allow_origins=cors_origins(), allow_methods=["GET", "POST"], allow_headers=["*"])
app.include_router(router)
