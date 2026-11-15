"""Modelo de caminata con traje y valores por defecto (spec 003, D-22 y D-23).

Fuentes en specs/003-motor-de-rutas/clarificacion.md. Son valores de referencia de NASA para EVA en
superficie lunar (Artemis): NASA no publica límites oficiales para Marte. No se ajusta la gravedad.
"""
import math

import numpy as np

MODEL_NAME = "tobler-eva-v1"
LEGACY_ALIASES = {"tobler-mars-v1": MODEL_NAME}  # valor usado en los ejemplos de la spec 000

FLAT_SPEED_KMH = 2.0       # NASA ConOps 2020: «~2 km/hr walking pace on relatively level regolith»
TOBLER_B = 3.5             # Tobler (1993)
TOBLER_C = 0.05            # Tobler (1993): la máxima velocidad es en bajada suave (−2.86°)
TOBLER_A = FLAT_SPEED_KMH / math.exp(-TOBLER_B * TOBLER_C)  # ≈ 2.38 km/h

DEFAULT_MAX_SLOPE_DEG = 20.0       # NASA ConOps 2020; Goodwin et al. 2024
DEFAULT_EVA_TIME_LIMIT_MIN = 360.0  # NASA ConOps 2020: 6 ± 2 h
DEFAULT_SOFT_SOIL_PENALTY = 2.0    # decisión de diseño (D-24)

SOURCES = {
    "nasa_eva_conops_2020": "https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf",
    "goodwin_2024": "https://discovery.ucl.ac.uk/id/eprint/10201492/1/1-s2.0-S0094576524007501-main.pdf",
}


def resolve_model(name: str) -> str | None:
    """Devuelve el nombre canónico del modelo o None si no se reconoce."""
    if name == MODEL_NAME:
        return name
    return LEGACY_ALIASES.get(name)


def speed_kmh(slope_tan):
    """Velocidad con traje (km/h) según la pendiente como tangente con signo (positiva = sube)."""
    return TOBLER_A * np.exp(-TOBLER_B * np.abs(np.asarray(slope_tan, dtype=float) + TOBLER_C))
