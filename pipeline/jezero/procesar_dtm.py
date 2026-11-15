"""Spec 002 · Recorte del DTM HiRISE de Jezero (Margin Unit) → productos de TEPEXA.

Entrada (data/raw/jezero-margin/, no va a Git):
  dtm-2m-meta.json   metadatos del recorte que se leyó del mosaico USGS
  dtm-2m-q16.bin     alturas en uint16: z = zbase + (q − 1)·0.1 m (0 = NoData), filas de sur a norte.
                     El paso de 10 cm está por debajo de la precisión vertical del DTM HiRISE.

El recorte se lee por rangos de bytes del mosaico «Mars 2020 TRN HiRISE DTM» (USGS, 1 m, sin
compresión) y se remuestrea a una rejilla de 2 m en metros reales sobre el terreno:
  x = (R·λ − xc)·cos(φc) + 2000      y = R·φ − yc + 1500      (R = 3 396 190 m)
El factor cos(φc) corrige la proyección equirectangular (paralelo estándar 0°), que estira el
eje este-oeste un 5 % a esta latitud.

Salida:
  backend/app/routing/data/jezero-margin_hirise-v1.npz   rejilla de rutas de 10 m (va a Git, < 1 MB)
  data/processed/jezero-margin/hirise-v1/                PNG 16 bits, relieve sombreado, manifiesto (van a R2)

Uso: python pipeline/jezero/procesar_dtm.py
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "data" / "raw" / "jezero-margin"
OUT = REPO / "data" / "processed" / "jezero-margin" / "hirise-v1"
ROUTING = REPO / "backend" / "app" / "routing" / "data" / "jezero-margin_hirise-v1.npz"
WEB = REPO / "backend" / "static" / "terrain" / "jezero-margin" / "hirise-v1"  # lo sirve la API en /assets (~3 MB)
MARS_TINT = np.array([0.80, 0.55, 0.38])  # color de referencia para la textura de relieve (no es color real)
ROUTING_CELL_M = 10.0  # D-21


def load() -> tuple[np.ndarray, dict]:
    meta = json.loads((RAW / "dtm-2m-meta.json").read_text(encoding="utf-8"))
    q = np.fromfile(RAW / "dtm-2m-q16.bin", dtype="<u2").reshape(meta["rows"], meta["cols"])
    z = meta["zbase"] + (q.astype(np.float64) - 1) * meta["step_m"]
    z[q == 0] = np.nan
    # El remuestreo bilineal deja sin dato solo el borde exterior (1 celda): se copia el vecino.
    interior = np.isnan(z[1:-1, 1:-1]).sum()
    if interior:
        raise SystemExit(f"Hay {interior} celdas sin dato dentro del recorte: revisar la lectura")
    z[0, :], z[-1, :] = z[1, :], z[-2, :]
    z[:, 0], z[:, -1] = z[:, 1], z[:, -2]
    return z, meta


def hillshade(z: np.ndarray, cell: float, az=315.0, alt=45.0) -> np.ndarray:
    zf = np.where(np.isfinite(z), z, np.nanmean(z))
    gy, gx = np.gradient(zf, cell)            # filas = norte, columnas = este
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, -gy)
    a, e = math.radians(az), math.radians(alt)
    hs = np.sin(e) * np.cos(slope) + np.cos(e) * np.sin(slope) * np.cos(a - aspect)
    return np.clip(hs, 0, 1)


def png16(z: np.ndarray, zmin: float, zmax: float, path: Path) -> None:
    """Mapa de alturas: z = z_min + valor/65535·(z_max − z_min). Fila 0 de la imagen = norte."""
    q = np.where(np.isfinite(z), np.round((z - zmin) / (zmax - zmin) * 65535), 0).astype(np.uint16)
    Image.fromarray(np.ascontiguousarray(q[::-1])).save(path, optimize=True)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    z, meta = load()
    OUT.mkdir(parents=True, exist_ok=True)
    ROUTING.parent.mkdir(parents=True, exist_ok=True)
    cell = meta["cell_m"]
    zmin, zmax = float(np.nanmin(z)), float(np.nanmax(z))

    step = int(ROUTING_CELL_M / cell)
    z10 = z[::step, ::step].astype(np.float32)
    np.savez_compressed(ROUTING, z=z10, cell_m=ROUTING_CELL_M, origin_x=0.0, origin_y=0.0,
                        dataset_version="hirise-v1", meta=json.dumps(meta))

    WEB.mkdir(parents=True, exist_ok=True)
    png16(z, zmin, zmax, WEB / "heightmap-lod0.png")
    png16(z[::2, ::2], zmin, zmax, WEB / "heightmap-lod1.png")
    hs = hillshade(z, cell)
    rgb = (np.clip(0.25 + 0.85 * hs, 0, 1)[..., None] * MARS_TINT * 255).astype(np.uint8)
    Image.fromarray(np.ascontiguousarray(rgb[::-1])).save(WEB / "texture-relief.webp", quality=85)
    # Capas 2D (OpenLayers ImageStatic): relieve sombreado y elevación en color, fila 0 = norte.
    Image.fromarray(np.ascontiguousarray((hs[::-1] * 255).astype(np.uint8))).save(WEB / "layer-hillshade.webp", quality=85)
    t = np.clip((z - zmin) / (zmax - zmin), 0, 1)[..., None]
    stops = np.array([[0x1B, 0x3A, 0x4B], [0x8C, 0x6B, 0x4F], [0xE8, 0xD9, 0xB5]], dtype=float)
    rgb_e = np.where(t < 0.5, stops[0] + (stops[1] - stops[0]) * (t / 0.5), stops[1] + (stops[2] - stops[1]) * ((t - 0.5) / 0.5))
    Image.fromarray(np.ascontiguousarray(rgb_e[::-1].astype(np.uint8))).save(WEB / "layer-elevation.webp", quality=85)
    web_files = {}
    for name in ("heightmap-lod0.png", "heightmap-lod1.png", "texture-relief.webp", "layer-hillshade.webp", "layer-elevation.webp"):
        path = WEB / name
        w, h = Image.open(path).size
        web_files[name] = {"bytes": path.stat().st_size, "sha256": sha256(path), "width_px": w, "height_px": h}
    (WEB / "terrain.json").write_text(json.dumps({
        "dataset_version": "hirise-v1", "region_id": "jezero-margin", "z_min_m": round(zmin, 2),
        "z_max_m": round(zmax, 2), "meters_per_px": {"heightmap-lod0.png": cell, "heightmap-lod1.png": cell * 2},
        "width_m": meta["frame"]["width_m"], "height_m": meta["frame"]["height_m"], "source": meta["source"],
        "files": web_files}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    Image.fromarray((hs[::-1] * 255).astype(np.uint8), mode="L").save(OUT / "hillshade-2m.png", optimize=True)
    Image.fromarray((hs[::-1] * 255).astype(np.uint8), mode="L").resize((512, 384)).save(OUT / "thumbnail.webp", quality=80)

    files = {p.name: {"bytes": p.stat().st_size, "sha256": sha256(p)} for p in sorted(OUT.glob("*.*")) if p.name != "manifest.json"}
    manifest = {
        "dataset_version": "hirise-v1", "region_id": "jezero-margin", "source": meta["source"],
        "frame": meta["frame"], "cell_m": cell, "rows": int(z.shape[0]), "cols": int(z.shape[1]),
        "z_min_m": round(zmin, 2), "z_max_m": round(zmax, 2), "vertical_step_m": meta["step_m"],
        "routing_grid": {"file": str(ROUTING.relative_to(REPO)), "cell_m": ROUTING_CELL_M,
                         "rows": int(z10.shape[0]), "cols": int(z10.shape[1]), "sha256": sha256(ROUTING)},
        "files": files,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: manifest[k] for k in ("rows", "cols", "z_min_m", "z_max_m")}))
    print({k: v["bytes"] for k, v in files.items()})


if __name__ == "__main__":
    main()
