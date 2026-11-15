"""API de TEPEXA."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from . import errors, terrain_store
from .api.v1 import router
from .settings import APP_VERSION, cors_origin_regex, cors_origins

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
app.add_middleware(GZipMiddleware, minimum_size=1000)  # las rutas pesan ~200 KB sin comprimir
app.add_middleware(CORSMiddleware, allow_origins=cors_origins(), allow_origin_regex=cors_origin_regex(),
                   allow_methods=["GET", "POST"], allow_headers=["*"])
app.include_router(router)
# Terreno 3D real (heightmaps PNG 16 bits y textura): ~3 MB por región. Ver terrain_store.py.
app.mount("/assets", StaticFiles(directory=terrain_store.STATIC), name="assets")
