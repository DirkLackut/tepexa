"""Terreno sintético de EJEMPLO para Jezero (is_example: true). Única fuente (D-27).

No es un dato de NASA: es una función con una pendiente general, ondulaciones y una colina entre
los objetivos 2 y 3, más una zona circular de suelo suelto. Sirve para que las rutas de ejemplo
y el motor en vivo sean coherentes hasta que la spec 002 entregue el DTM HiRISE.
"""
from functools import lru_cache

import numpy as np

from .terrain import Terrain

WIDTH_M, HEIGHT_M = 4000.0, 3000.0
SOFT_CIRCLE = (1800.0, 1150.0, 260.0)  # x, y, radio
DATASET_VERSION = "example-v0"
GRID_CELL_M = 10.0  # D-21


def z(x, y):
    hill = 70.0 * np.exp(-((x - 2700.0) ** 2 + (y - 1600.0) ** 2) / (2 * 130.0 ** 2))
    return -2440.0 + 0.03 * x + 0.01 * y + 12.0 * np.sin(x / 300.0) * np.cos(y / 350.0) + hill


def is_soft(x, y):
    return np.hypot(np.asarray(x) - SOFT_CIRCLE[0], np.asarray(y) - SOFT_CIRCLE[1]) <= SOFT_CIRCLE[2]


def z_scalar(x: float, y: float) -> float:
    return float(z(x, y))


@lru_cache
def example_terrain(cell_m: float = GRID_CELL_M) -> Terrain:
    xs = np.arange(0.0, WIDTH_M + cell_m / 2, cell_m)
    ys = np.arange(0.0, HEIGHT_M + cell_m / 2, cell_m)
    X, Y = np.meshgrid(xs, ys)
    return Terrain(z=np.round(z(X, Y), 2), cell_m=cell_m, soft=is_soft(X, Y), dataset_version=DATASET_VERSION,
                   is_example=True, notes={"terrain": "synthetic"})


def elevation_range() -> tuple[float, float]:
    t = example_terrain()
    return round(float(np.nanmin(t.z)), 1), round(float(np.nanmax(t.z)), 1)
