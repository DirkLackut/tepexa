# Spec 000 — Plan técnico

## Decisiones

| ID | Decisión | Motivo | Alternativa descartada |
|---|---|---|---|
| D-1 | FastAPI 0.163 + Pydantic 2.13 | OpenAPI automático desde los modelos | Escribir el YAML a mano: se desincroniza |
| D-2 | Los modelos viven en `backend/app/contract/` y `contracts/openapi.json` se genera de ellos | Una sola fuente de verdad | Mantener tipos duplicados |
| D-3 | `LocalizedText = {es, en}` | Bilingüe en una sola respuesta | Parámetro `?lang=` (obliga a dos llamadas para cambiar de idioma) |
| D-4 | Marco local en metros, origen en la esquina suroeste | Medidas directas para rutas y 3D | Lat/lon marcianas en cada punto |
| D-5 | `is_example: true` en las respuestas de ejemplo | Principio 1 | Confiar en que el frontend «sabe» |
| D-8 | Los ejemplos se generan con `contracts/tools/generar_ejemplos.py` a partir de los modelos | Siempre válidos; la ruta de ejemplo tiene métricas calculadas, no inventadas | Escribir los JSON a mano |
| D-9 | Modo `example` del backend: cada endpoint devuelve su archivo de ejemplo | El equipo puede probar contra una API real desde ya | Esperar a las specs 001–005 |
| D-10 | Errores con forma `{error: {code, message: {es, en}, details}}` | El frontend muestra el mensaje sin traducir | Mensajes solo en inglés de FastAPI |

## Endpoints (prefijo `/api/v1`)

| Método | Ruta | Respuesta | Errores |
|---|---|---|---|
| GET | `/health` | `Health` | — |
| GET | `/regions` | `RegionList` | — |
| GET | `/regions/{region_id}` | `RegionDetail` | 404 |
| GET | `/regions/{region_id}/layers` | `LayerList` | 404, 409 |
| GET | `/regions/{region_id}/pois` | `PoiCollection` | 404 |
| GET | `/regions/{region_id}/terrain` | `TerrainManifest` | 404, 409 |
| POST | `/routes/compare` | `RouteResponse` | 404, 409, 422 |
| POST | `/missions` | `Mission` (201) | 404, 409, 422 |
| GET | `/missions/{mission_id}` | `Mission` | 404 |
| GET | `/missions/{mission_id}/report` | `MissionReport` | 404 |

Códigos de error: `BAD_REQUEST`, `REGION_NOT_FOUND`, `REGION_PREVIEW_ONLY`, `OUT_OF_BOUNDS`,
`NODATA`, `NO_ROUTE`, `MISSION_NOT_FOUND`, `DATASET_UNAVAILABLE`, `INTERNAL`.
Códigos de advertencia: `EXAMPLE_DATA`, `STEEP_SEGMENT`, `SOFT_SOIL`, `EVA_LIMIT_EXCEEDED`,
`LOW_DATA_RESOLUTION`, `CONCEPTUAL_ONLY`.

## Modelo de coordenadas
- Marco local por región (`coordinate_frame.id`, por ejemplo `jezero-margin-local-m`).
- `x` este, `y` norte, en metros, origen en la esquina suroeste del recorte del DEM.
- `z` elevación en metros respecto al datum del DEM.
- Escena 3D: `escena.x = x − centro_x`, `escena.y = z − z_ref`, `escena.z = −(y − centro_y)`,
  multiplicado por `units_per_meter` (eje Y arriba, como three.js).
- La transformación desde la proyección marciana de origen se documenta en la spec 002.

## Dónde vive cada regla

| Regla | Dónde | Por qué |
|---|---|---|
| Forma de los datos | Modelos Pydantic | Valida entradas y salidas y genera OpenAPI |
| Región `preview` sin rutas | Capa de API | Igual en modo ejemplo y en modo real |
| Ejemplos marcados | Generador de ejemplos | Imposible olvidarlo |

## Estrategia de pruebas
- `test_examples_validate`: cada JSON contra su modelo (CE-1).
- `test_openapi_up_to_date`: el archivo coincide con el generado (CE-2).
- `test_endpoints_example_mode`: cliente de prueba contra cada endpoint (CE-3).
- `test_errors`: 404 y 409 con forma y mensajes correctos (CE-4).
- `test_route_example_consistency`: recalcula métricas desde la polilínea (CE-5).
- `test_localized_text_complete`: recorre todos los ejemplos (CE-6).

## Dependencias
`fastapi==0.163.0`, `pydantic==2.13.5`, `uvicorn` (servidor), `pytest==9.1.1` y
`httpx==0.28.1` (pruebas).

## Riesgos

| Riesgo | Señal | Qué haríamos |
|---|---|---|
| El frontend necesita un campo que no está | Duda en `clarificacion.md` | PR al contrato con revisión de ambos lados |
| Los datos reales no caben en el formato de teselas previsto | Spec 002 | Cambiar solo `TileSource.format` |
