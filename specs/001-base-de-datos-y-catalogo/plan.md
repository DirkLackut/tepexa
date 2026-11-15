# Spec 001 — Plan técnico

## Decisiones

| ID | Decisión | Motivo | Alternativa descartada |
|---|---|---|---|
| D-11 | Migraciones SQL numeradas en `backend/db/migrations/` con tabla `schema_migrations` | Se aplican pegándolas en el SQL Editor de Neon y se prueban igual en local | Alembic: necesita conectarse a Neon desde una máquina que no llega |
| D-12 | psycopg 3 + `psycopg_pool` (máximo 4 conexiones) | Driver estándar, sin ORM; Neon gratis tiene pocas conexiones | SQLAlchemy: más capas para pocas consultas |
| D-13 | Textos bilingües como `jsonb` con `CHECK tepexa_is_localized(...)` | La base garantiza `{es, en}` no vacíos (RF-001-07) | Columnas `_es` y `_en` duplicadas en cada tabla |
| D-14 | Geometrías `geometry(Point, 0)` en metros del marco local | Principio 9; sin geodesia terrestre | `geography` o EPSG:4326 |
| D-15 | Modo por endpoint: `live` solo donde ya hay datos reales; el resto sigue en ejemplo | El equipo usa una sola URL que mejora sola | Esperar a tener todo real para publicar |
| D-16 | `/health` agrega `endpoints: {nombre: "live" \| "example"}` | El frontend sabe qué es real (cambio que solo agrega) | Que el equipo lo adivine por `is_example` |
| D-17 | La semilla del catálogo se genera desde `contracts/examples/` | Una sola fuente; las pruebas comparan base y contrato | Escribir los INSERT a mano |
| D-18 | Render con `render.yaml` (Blueprint), región Virginia, sin `rootDir` | El servicio ve `contracts/` y queda cerca de Neon (us-east-1) | Cloud Run (descartado por el equipo) |
| D-19 | CORS: lista de orígenes y una expresión regular para las vistas previas de Vercel | Las URL de vista previa cambian en cada PR | Permitir `*` |

## Esquema

| Tabla | Contenido | Llave |
|---|---|---|
| `schema_migrations` | Versión y fecha de cada migración | `version` |
| `sources` | Procedencia de datos (misión, instrumento, producto, URL, atribución) | `id` |
| `regions` | Región: estado, nombre, resumen, centro, marco, límites, elevación, objetivo, parámetros de ruta por defecto, disponibilidad | `id` |
| `region_facts` | Hechos de la región con certeza y orden | `(region_id, ord)` |
| `region_fact_sources` | Fuentes de cada hecho | `(region_id, fact_ord, source_id)` |
| `layers` | Capas científicas (se llena en la spec 002) | `(region_id, id)` |
| `pois` | Puntos de interés con `geometry(Point, 0)` e índice GiST | `(region_id, id)` |
| `poi_sources` | Evidencia de cada punto | `(region_id, poi_id, source_id)` |
| `poi_images` | Imágenes con crédito y pie bilingüe | `(region_id, poi_id, ord)` |

## Dependencias nuevas
`psycopg[binary]==3.3.9`, `psycopg-pool==3.3.3`.

## Estrategia de pruebas
Las pruebas de base usan `TEST_DATABASE_URL` (PostgreSQL con PostGIS). Si no está definida, se
saltan y las de la spec 000 siguen corriendo. Cada prueba crea un esquema limpio, aplica las
migraciones y la semilla, y compara las respuestas `live` con los ejemplos del contrato.

## Despliegue (Render)
- Build: `pip install -r backend/requirements.txt`
- Start: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Variables: `TEPEXA_MODE=live`, `DATABASE_URL` (la pega Dirk), `TEPEXA_CORS_ORIGINS`,
  `TEPEXA_CORS_ORIGIN_REGEX`, `PYTHON_VERSION=3.13.15`.
- Health check: `/api/v1/health`.

## Riesgos

| Riesgo | Señal | Qué haríamos |
|---|---|---|
| Neon no tiene PostGIS habilitable | Error en la migración 001 | Revisar con `pg_available_extensions` antes de aplicar |
| Render tarda en despertar en la demo | Primera carga lenta | Abrir `/health` antes de presentar |
| Neon suspende el cómputo | Primera consulta lenta (~1 s) | Aceptable para la demo |
