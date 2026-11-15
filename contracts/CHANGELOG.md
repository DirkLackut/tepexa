# Cambios del contrato

Solo cambios que agregan dentro de `/api/v1` (ver «Compatibilidad» en `contracts/README.md`).

## 0.4.0 — spec 002, parte 1 (15-nov-2026)
- En modo live, Jezero pasa a **datos reales** (`dataset_version: hirise-v1`, `is_example: false`):
  - `/regions/jezero-margin`: centro 18.487 N, 77.325 E; elevación −2443.1 a −1995.0 m; nuevo objetivo de misión.
  - `/regions/jezero-margin/pois`: base (elegida por el equipo) y 5 sitios reales de Perseverance
    (Pelican Point, Lefroy Bay, Comet Geyser, Old Faithful Geyser, Eremita Mesa). Los `id` cambiaron.
  - `/routes/compare`: calcula sobre el DTM HiRISE real; ya no trae `EXAMPLE_DATA`.
  - `/regions/jezero-margin/terrain`: heightmaps PNG 16 bits reales (2 m y 4 m) y textura de relieve,
    servidos por la API en `/assets/terrain/...`.
- `thumbnail_url` de Jezero es `null` por ahora.
- Los archivos de `examples/` siguen siendo los de ejemplo (terreno sintético) para trabajar sin la API.
- Sin cambios de forma.

## 0.3.0 — spec 003 (15-nov-2026)
- `POST /routes/compare` **calcula en vivo** con el motor de rutas. Mientras no llegue el DTM real
  (spec 002) lo hace sobre el terreno sintético y responde `is_example: true`. La forma no cambia.
- Valores por defecto de Jezero (`route_defaults`), ahora con fuente de NASA: pendiente máxima
  **20°** (antes 25), EVA **360 min** (antes 240), modelo `tobler-eva-v1` (antes `tobler-mars-v1`,
  que se sigue aceptando como alias).
- `error-no-route.json`: `details` ahora trae `profile`, `from_index`, `to_index` y `max_slope_deg`.
- Nuevo error posible: `BAD_REQUEST` si `walking_model` no existe.
- `route-response.json`, `mission.json` y `mission-report.json` regenerados con el motor real
  (misma forma, valores nuevos). `cost_model.parameters` trae `grid_cell_m` y los parámetros de Tobler.

## 0.2.0 — spec 001 (14-nov-2026)
- `Health.endpoints` (nuevo, opcional): por endpoint, `live` si ya responde con datos reales o
  `example` si sigue con datos de ejemplo.
- En modo `live`, `/regions`, `/regions/{id}` y `/regions/{id}/pois` leen de la base. Su forma no
  cambia.

## 0.1.0 — spec 000 (14-nov-2026)
- Contrato inicial: regiones, capas, puntos de interés, terreno, rutas, misiones, informe,
  errores y advertencias.
