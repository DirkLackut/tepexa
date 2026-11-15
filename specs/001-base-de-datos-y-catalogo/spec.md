# Spec 001 — Base de datos y catálogo

Estado: En curso
Depende de: 000
Cubre: RF-000-01, RF-000-02 y RF-000-04 con datos guardados en Neon; primera publicación de la API.

## 1. Problema
La API de la spec 000 responde con archivos fijos. El equipo necesita una URL publicada que
vaya pasando a datos reales sin cambiar la forma de las respuestas, y el backend necesita un
lugar donde guardar regiones, hechos, fuentes, capas y puntos de interés.

## 2. Alcance

**Incluye**
- Esquema en PostgreSQL + PostGIS (Neon) con migraciones SQL versionadas.
- Carga inicial del catálogo: regiones, hechos con fuente y certeza, puntos de interés.
- Modo `live` de la API: `/regions`, `/regions/{id}` y `/regions/{id}/pois` leen de la base.
  Los demás endpoints siguen en modo ejemplo hasta su spec.
- `/health` indica qué endpoints ya son reales.
- Publicación de la API en Render (plan gratuito, región Virginia).
- `CODEOWNERS` para que GitHub pida la revisión correcta en cada carpeta.

**No incluye**
- Datos reales de NASA (spec 002): los puntos de interés siguen con ubicaciones de ejemplo.
- Capas, terreno, rutas y misiones reales (specs 002 a 005). La tabla de capas se crea, pero se
  llena en la 002.

## 3. Requisitos (EARS)
- **RF-001-01** El sistema DEBE guardar regiones, hechos, fuentes, capas y puntos de interés en
  PostgreSQL con PostGIS, con geometrías en el marco local de cada región (SRID 0).
- **RF-001-02** CUANDO la API corre en modo `live`, `/regions`, `/regions/{id}` y
  `/regions/{id}/pois` DEBEN leer de la base y devolver exactamente la forma del contrato.
- **RF-001-03** Los endpoints que todavía no tienen datos reales DEBEN seguir respondiendo con los
  ejemplos y `is_example: true`.
- **RF-001-04** `/health` DEBE informar, por endpoint, si responde con datos `live` o `example`.
- **RF-001-05** SI la base no responde, ENTONCES la API DEBE devolver 503 `DATASET_UNAVAILABLE`
  con mensaje bilingüe, sin exponer detalles de la conexión.
- **RF-001-06** Cada migración DEBE poder aplicarse una sola vez y quedar registrada.
- **RF-001-07** Un texto para el usuario guardado en la base DEBE tener `es` y `en` no vacíos; la
  base rechaza lo contrario.

## 4. Reglas
- **RN-001-01** La cadena de conexión solo vive en `backend/.env.local` y en las variables de
  Render. Nunca en el repo, el frontend ni el chat.
- **RN-001-02** Una geometría siempre va con su `region_id`; no se mezclan regiones en un cálculo.
- **RN-001-03** Cambiar el esquema es una migración nueva; las aplicadas no se editan.

## 5. Criterios de aceptación

| ID | Criterio | Cómo se comprueba |
|---|---|---|
| CE-1 | Las migraciones se aplican sobre una base vacía con PostGIS y quedan registradas | `test_migrations_apply` |
| CE-2 | La base rechaza un texto sin `en` o vacío | `test_localized_check` |
| CE-3 | En modo `live`, `/regions`, `/regions/{id}` y `/pois` devuelven lo mismo que los ejemplos del contrato | `test_live_matches_contract` |
| CE-4 | En modo `live`, capas, terreno, rutas y misiones siguen en ejemplo y `/health` lo dice | `test_health_endpoints_status` |
| CE-5 | Sin base disponible, los endpoints `live` responden 503 `DATASET_UNAVAILABLE` | `test_db_unavailable` |
| CE-6 | Las pruebas de la spec 000 siguen pasando | `pytest` |
| CE-7 | La API publicada en Render responde `/api/v1/health` con `mode: live` | Lista manual |

## 6. Lista de comprobación manual
1. En el SQL Editor de Neon, `select * from schema_migrations` muestra las migraciones aplicadas.
2. `https://<servicio>.onrender.com/api/v1/health` responde 200 con `mode: "live"`.
3. `https://<servicio>.onrender.com/api/v1/regions/jezero-margin` muestra los cuatro hechos de la
   Margin Unit con sus fuentes.
4. `https://<servicio>.onrender.com/docs` abre la documentación interactiva.
5. Una petición desde la URL de Vercel del equipo no da error de CORS.
