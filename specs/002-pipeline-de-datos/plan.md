# Spec 002 — Plan

## Flujo (hecho el 15-nov)
```
Mosaico USGS (GeoTIFF 1 m, float32 sin compresión, 1.8 GB)
  → navegador integrado: lectura por rangos de las filas del recorte (~260 MB leídos, nada guardado en la PC)
  → remuestreo bilineal a 2 m en metros reales (corrige cos φ) → uint16 de 10 cm → gzip → entorno de trabajo
  → pipeline/jezero/procesar_dtm.py
       backend/app/routing/data/jezero-margin_hirise-v1.npz   rejilla de rutas de 10 m (208 KB)
       backend/static/terrain/jezero-margin/hirise-v1/        heightmap 2 m y 4 m (PNG 16 bits) + textura de relieve
  → pipeline/jezero/catalogo_hirise.py → backend/db/seeds/002_jezero_hirise.sql (región y puntos reales)
```

## Decisiones
| ID | Decisión | Motivo |
|---|---|---|
| D-28 | Recorte de 4 × 3 km centrado en 18.487 N, 77.325 E, en metros reales sobre el terreno | Cubre toda la travesía de la Margin Unit; conserva el marco de la spec 000 (0–4000 × 0–3000) |
| D-29 | El terreno 3D (2.7 MB) lo sirve la API en `/assets` con `TEPEXA_PUBLIC_URL` | Evita un paso manual en R2; R2 queda para la ortoimagen |
| D-30 | Textura provisional: relieve sombreado del DTM con un tono marciano | No hay ortoimagen todavía; la fuente declarada es el DTM, no una foto |
| D-31 | Semilla 002 separada de la 001; se aplica siempre después | La 001 sigue siendo el catálogo de ejemplo de las pruebas y del contrato |

## Dependencias
- `pillow` (solo para el pipeline, no para la API).
