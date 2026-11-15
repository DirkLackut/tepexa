"""Manifiesto del terreno 3D real (spec 002/005). Los archivos los sirve la API en /assets.

TEPEXA_PUBLIC_URL (p. ej. https://tepexa-api.onrender.com) hace absolutas las URL para que el
frontend en Vercel las cargue. Sin ella quedan relativas a la API.
"""
import json
import os
from functools import lru_cache
from pathlib import Path

from .contract import (
    Bounds, Heightmap, LocalizedText as T, SceneTransform, Source, TerrainLod, TerrainManifest, TerrainTexture,
)

STATIC = Path(__file__).resolve().parents[1] / "static"


def public_url() -> str:
    return os.getenv("TEPEXA_PUBLIC_URL", "").rstrip("/")


@lru_cache
def _meta(region_id: str, dataset_version: str) -> dict | None:
    path = STATIC / "terrain" / region_id / dataset_version / "terrain.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def manifest(region_id: str, dataset_version: str, frame_id: str) -> TerrainManifest | None:
    m = _meta(region_id, dataset_version)
    if m is None:
        return None
    base = f"{public_url()}/assets/terrain/{region_id}/{dataset_version}"
    f = m["files"]
    lod0, lod1, tex = f["heightmap-lod0.png"], f["heightmap-lod1.png"], f["texture-relief.webp"]
    src = Source(**{k: m["source"][k] for k in ("mission", "instrument", "product_id", "url", "attribution")})
    return TerrainManifest(
        region_id=region_id, is_example=False, version=dataset_version, coordinate_frame=frame_id,
        extent=Bounds(min_x=0, min_y=0, max_x=m["width_m"], max_y=m["height_m"]),
        z_min_m=m["z_min_m"], z_max_m=m["z_max_m"],
        heightmap=Heightmap(url=f"{base}/heightmap-lod0.png", format="png16", width_px=lod0["width_px"],
                            height_px=lod0["height_px"], meters_per_px=m["meters_per_px"]["heightmap-lod0.png"],
                            sha256=lod0["sha256"]),
        texture=TerrainTexture(url=f"{base}/texture-relief.webp", format="webp", width_px=tex["width_px"],
                               height_px=tex["height_px"], source=src, sha256=tex["sha256"]),
        lods=[TerrainLod(level=0, heightmap_url=f"{base}/heightmap-lod0.png", width_px=lod0["width_px"],
                         height_px=lod0["height_px"], recommended_for="desktop"),
              TerrainLod(level=1, heightmap_url=f"{base}/heightmap-lod1.png", width_px=lod1["width_px"],
                         height_px=lod1["height_px"], recommended_for="mobile")],
        vertical_exaggeration_default=1.0,
        scene_transform=SceneTransform(
            units_per_meter=0.01, center_x_m=m["width_m"] / 2, center_y_m=m["height_m"] / 2, z_ref_m=m["z_min_m"],
            formula=T(es="escena.x = (x − centro_x)·u; escena.y = (z − z_ref)·u·exageración; escena.z = −(y − centro_y)·u",
                      en="scene.x = (x − center_x)·u; scene.y = (z − z_ref)·u·exaggeration; scene.z = −(y − center_y)·u")),
        total_size_bytes=sum(v["bytes"] for v in f.values()))


# ---------------------------------------------------------------- capas 2D reales (spec 002, T11)
def layers(region_id: str, dataset_version: str):
    """Capas que salen del DTM: relieve sombreado y elevación, como imágenes georreferenciadas al marco local.
    Ortoimagen, inercia térmica y mineralogía todavía no están: no se listan (principio 1)."""
    from .contract import Layer, LayerList, Legend, LegendStop, TileSource

    m = _meta(region_id, dataset_version)
    if m is None or "layer-hillshade.webp" not in m["files"]:
        return None
    base = f"{public_url()}/assets/terrain/{region_id}/{dataset_version}"
    extent = Bounds(min_x=0, min_y=0, max_x=m["width_m"], max_y=m["height_m"])
    src = Source(**{k: m["source"][k] for k in ("mission", "instrument", "product_id", "url", "attribution")})
    lim = T(es="Calculada del DTM HiRISE de 1 m remuestreado a 2 m en el marco local.",
            en="Computed from the 1 m HiRISE DTM resampled to 2 m in the local frame.")
    items = [
        Layer(id="hillshade", kind="hillshade", title=T(es="Relieve sombreado", en="Hillshade"),
              description=T(es="Sombras calculadas de la elevación para leer la forma del terreno.",
                            en="Shading computed from elevation to read the shape of the terrain."),
              source=src, resolution_m=2.0, units=None, legend=None,
              tiles=TileSource(format="image", url=f"{base}/layer-hillshade.webp", extent=extent),
              default_visible=True, default_opacity=1.0, z_order=0, used_in_routing=False, limitations=lim),
        Layer(id="elevation", kind="elevation", title=T(es="Elevación", en="Elevation"),
              description=T(es="Altura del terreno sobre el geoide de Marte; es la base del cálculo de rutas y del 3D.",
                            en="Terrain height above the Mars geoid; it is the basis for routes and the 3D view."),
              source=src, resolution_m=2.0, units="m",
              legend=Legend(type="continuous", units="m", stops=[
                  LegendStop(value=m["z_min_m"], color="#1B3A4B", label=T(es="Más bajo", en="Lowest")),
                  LegendStop(value=round((m["z_min_m"] + m["z_max_m"]) / 2, 1), color="#8C6B4F", label=T(es="Medio", en="Middle")),
                  LegendStop(value=m["z_max_m"], color="#E8D9B5", label=T(es="Más alto", en="Highest"))]),
              tiles=TileSource(format="image", url=f"{base}/layer-elevation.webp", extent=extent),
              default_visible=False, default_opacity=0.6, z_order=1, used_in_routing=True, limitations=lim),
    ]
    return LayerList(region_id=region_id, is_example=False, dataset_version=dataset_version, items=items)
