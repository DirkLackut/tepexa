# Contrato de la API — guía para el frontend

Todo lo que el backend va a responder ya está aquí. Pueden programar las pantallas contra los
archivos de `examples/` desde hoy; cuando la API esté publicada, solo cambian la URL base.

- **Base:** `/api/v1` (local: `http://localhost:8000/api/v1`; publicada: `https://tepexa-api.onrender.com/api/v1`).
  Todo responde en vivo con **datos reales de Jezero** (DTM HiRISE y sitios de Perseverance):
  regiones, puntos de interés, capas, terreno 3D, rutas y misiones con informe.
  Guíense siempre por `is_example` de cada respuesta. Guía de traspaso: `docs/HANDOFF-FRONTEND.md`.
  Los JSON de `examples/` son el terreno sintético: sirven para trabajar sin la API, pero sus puntos y
  alturas no son los reales.
  Render gratis se duerme a los 15 min: la primera llamada puede tardar ~50 s.
- **Qué es real y qué es ejemplo:** `GET /api/v1/health` → `endpoints` (`live` o `example`).
- **Definición completa:** `openapi.json` (sirve para generar tipos de TypeScript, por ejemplo
  con `npx openapi-typescript contracts/openapi.json -o frontend/src/shared/api/types.ts`).
- **Ejemplos:** `examples/*.json`. Son datos **de ejemplo** (`is_example: true`): el terreno es
  sintético. No los muestren como datos de NASA; los hechos científicos sí son reales y traen su
  fuente.

## Qué usa cada pantalla

| Pantalla | Endpoint | Ejemplo |
|---|---|---|
| Lista de regiones / próxima misión | `GET /regions` | `regions.json` |
| Ficha de la región (objetivo, hechos con certeza, parámetros por defecto) | `GET /regions/{id}` | `region-jezero.json`, `region-medusae-fossae.json` |
| Explorar: capas y leyendas | `GET /regions/{id}/layers` | `layers-jezero.json` |
| Explorar: puntos de interés (GeoJSON) | `GET /regions/{id}/pois` | `pois-jezero.json` |
| Planificar: comparar rutas | `POST /routes/compare` con `route-request.json` | `route-response.json` |
| Simular: terreno 3D | `GET /regions/{id}/terrain` | `terrain-jezero.json` |
| Guardar misión | `POST /missions` con `mission-create.json` | `mission.json` |
| Resultados: informe | `GET /missions/{id}/report` | `mission-report.json` |
| Estado del servicio | `GET /health` | `health.json` |

Regiones: `jezero-margin` (activa) y `medusae-fossae` (avance de próxima misión: no tiene capas,
terreno ni rutas; muestra ficha y hechos).

## Reglas para leer los datos

1. **Textos:** todo texto para el usuario viene como `{ "es": "...", "en": "..." }`. Elijan el
   idioma en el frontend; no hace falta otra llamada.
2. **Coordenadas:** metros en el marco local de la región. `x` al este, `y` al norte, origen en la
   esquina suroeste (`bounds`). `z` es la elevación en metros. No son latitud/longitud.
   - En OpenLayers: definan una proyección propia con unidades `m` y `extent = [min_x, min_y, max_x, max_y]`.
   - En la escena 3D usen `terrain.scene_transform` (eje Y arriba).
3. **Rutas:** `routes[]` trae un elemento por perfil (`shortest`, `fastest`, `safest`). Cada uno
   tiene `outbound` (ida), `return_trip` (vuelta), `total`, `within_eva_limit` y `warnings`.
   `outbound.legs[]` indica en qué vértices de la polilínea empieza y termina cada tramo entre
   objetivos. `elevation_profile` sirve para el gráfico de perfil.
   **El simulador 3D, el minimapa y el mapa deben usar la misma polilínea** (constitución, principio 4).
4. **Capas 2D:** si `tiles.format` es `"image"`, es una sola imagen que cubre `tiles.extent`
   (OpenLayers: `ImageStatic` con la proyección local). Si es `"xyz"`, es una plantilla de teselas.
5. **Terreno 3D:** `heightmap` es un PNG de 16 bits:
   `z = z_min_m + (valor / 65535) · (z_max_m − z_min_m)`. Usen `lods[]` con `recommended_for`
   para elegir resolución en PC o en móvil.
6. **Errores:** siempre `{ "error": { "code", "message": {es, en}, "details" } }`.

| Código | HTTP | Cuándo |
|---|---|---|
| `REGION_NOT_FOUND` | 404 | La región no existe |
| `REGION_PREVIEW_ONLY` | 409 | Capas, terreno o rutas de una región en avance |
| `OUT_OF_BOUNDS` | 422 | Un punto está fuera de los límites |
| `NODATA` | 422 | Un punto cae donde no hay datos |
| `NO_ROUTE` | 422 | Ninguna ruta respeta la pendiente máxima |
| `BAD_REQUEST` | 422 | La petición no tiene el formato esperado |
| `MISSION_NOT_FOUND` | 404 | La misión no existe |
| `DATASET_UNAVAILABLE` | 503 | Los datos no están disponibles en el servidor |
| `RATE_LIMITED` | 429 | Más de 10 misiones guardadas por IP en 10 min (`details.retry_after_s`) |

7. **Advertencias** (`warnings[].code`): `EXAMPLE_DATA`, `CONCEPTUAL_ONLY`, `SOFT_SOIL`,
   `STEEP_SEGMENT`, `EVA_LIMIT_EXCEEDED`, `LOW_DATA_RESOLUTION`. Muéstrenlas con su `message`.

## Compatibilidad (reglas de v1)
**El backend se compromete a:**
1. Dentro de `/api/v1` solo hacer cambios que **agregan**: campos nuevos opcionales o valores nuevos
   en listas de códigos. Nunca renombrar, quitar ni cambiar el tipo de un campo.
2. Si algún día hiciera falta un cambio que rompe, publicarlo como `/api/v2` sin apagar v1.
3. Anotar cada cambio en `contracts/CHANGELOG.md` y regenerar `openapi.json`.

**El frontend se compromete a:**
1. Generar los tipos de TypeScript desde `openapi.json`, no escribirlos a mano.
2. Ignorar campos que no conozca y mostrar `message` aunque llegue un código de advertencia nuevo.
3. Usar una sola URL base configurable (`VITE_API_URL`).
4. Mostrar una etiqueta «Datos de ejemplo» cuando `is_example` sea `true`.

## Cómo pedir un cambio
El contrato solo cambia por Pull Request revisado por el backend. Escriban la duda o el campo que
falta en `specs/000-contrato-api/clarificacion.md` o avísenle a Dirk.
