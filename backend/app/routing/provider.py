"""Proveedor de terreno para el motor de rutas (spec 003, D-21; spec 002).

- «example-v0»: terreno sintético (is_example: true).
- «hirise-v1»:  rejilla de 10 m del DTM HiRISE de la Margin Unit (pipeline/jezero/procesar_dtm.py).
"""
import json
from functools import lru_cache
from pathlib import Path

import numpy as np

from ..contract import RegionDetail
from ..errors import dataset_unavailable
from . import synthetic
from .terrain import Terrain

DATA = Path(__file__).resolve().parent / "data"


@lru_cache
def _grid(region_id: str, dataset_version: str) -> Terrain | None:
    path = DATA / f"{region_id}_{dataset_version}.npz"
    if not path.exists():
        return None
    d = np.load(path)
    meta = json.loads(str(d["meta"]))
    return Terrain(z=d["z"].astype(float), cell_m=float(d["cell_m"]), origin_x=float(d["origin_x"]),
                   origin_y=float(d["origin_y"]), soft=None, dataset_version=dataset_version, is_example=False,
                   notes={"terrain": "hirise-dtm", "soft_soil_data": False, "source": meta.get("source", {})})


def terrain_for(region: RegionDetail) -> Terrain:
    if region.dataset_version == synthetic.DATASET_VERSION:
        return synthetic.example_terrain()
    t = _grid(region.id, region.dataset_version)
    if t is None:
        raise dataset_unavailable()
    return t
