"""Rejilla de elevación para el motor de rutas (spec 003).

Convención: z[fila, columna], fila 0 = borde sur (y = origen_y), columna 0 = borde oeste (x = origen_x).
Las coordenadas son metros en el marco local de la región (D-4). NaN = NoData.
"""
from dataclasses import dataclass, field

import numpy as np

from ..errors import nodata


@dataclass
class Terrain:
    z: np.ndarray
    cell_m: float
    origin_x: float = 0.0
    origin_y: float = 0.0
    soft: np.ndarray | None = None          # True = suelo suelto (inercia térmica baja)
    dataset_version: str = "example-v0"
    is_example: bool = True
    notes: dict = field(default_factory=dict)
    # Tramos precalculados por el motor (engine._all_edges). La rejilla no se modifica después de usarla.
    _edges: tuple | None = field(default=None, init=False, repr=False, compare=False)

    def __post_init__(self):
        self.z = np.asarray(self.z, dtype=float)
        if self.soft is None:
            self.soft = np.zeros(self.z.shape, dtype=bool)

    @property
    def shape(self) -> tuple[int, int]:
        return self.z.shape

    def node(self, x: float, y: float) -> int:
        """Índice del nodo más cercano a (x, y). Lanza NODATA si cae sin datos o fuera de la rejilla."""
        rows, cols = self.shape
        j = int(round((x - self.origin_x) / self.cell_m))
        i = int(round((y - self.origin_y) / self.cell_m))
        if not (0 <= i < rows and 0 <= j < cols) or not np.isfinite(self.z[i, j]):
            raise nodata((x, y))
        return i * cols + j

    def xy(self, nodes: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        i, j = np.divmod(np.asarray(nodes), self.shape[1])
        return self.origin_x + j * self.cell_m, self.origin_y + i * self.cell_m

    def height_at(self, x: float, y: float) -> float:
        rows, cols = self.shape
        j = int(round((x - self.origin_x) / self.cell_m))
        i = int(round((y - self.origin_y) / self.cell_m))
        return float(self.z[i, j])
