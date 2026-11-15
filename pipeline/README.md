# Pipeline

Procesamiento de datos de NASA (spec 002) y, más adelante, optimización de assets de Blender (`.glb`).

## Jezero (Margin Unit)
1. `data/raw/jezero-margin/` (no va a Git): recorte del DTM leído por rangos del mosaico USGS
   (`dtm-2m-q16.bin` + `dtm-2m-meta.json`). Cómo se leyó: `specs/002-pipeline-de-datos/plan.md`.
2. `python pipeline/jezero/procesar_dtm.py` → rejilla de rutas (10 m) y terreno 3D (2 m).
3. `python pipeline/jezero/catalogo_hirise.py` → `backend/db/seeds/002_jezero_hirise.sql`.

Necesita `numpy` y `pillow`.
