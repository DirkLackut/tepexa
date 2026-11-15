# Spec 002 — Tareas

## Bloque A — Elegir y verificar los datos
- [x] T1 · Cobertura del mosaico HiRISE sobre la Margin Unit · Hecho 15-nov (clarificación 1)
- [ ] T2 · Elegir los productos de THEMIS (inercia térmica), CRISM y CTX
- [x] T3 · Obtener los datos · Hecho 15-nov sin descargar a la PC: lectura por rangos (clarificación 2)

## Bloque B — Pruebas
- [x] T4 · DTM contra la elevación del rover, terreno real en rutas, manifiesto y assets · `test_routes_api.py`, `test_db_hirise.py`

## Bloque C — Procesamiento
- [x] T5 · Recorte y paso al marco local · `pipeline/jezero/procesar_dtm.py`
- [ ] T6 · Teselas del mapa base, relieve, inercia térmica y mineralogía (`/layers` live)
- [x] T7 · Heightmap PNG 16 bits (2 m) y versión móvil (4 m)
- [x] T8 · Manifiesto con hashes (`terrain.json`, `data/processed/.../manifest.json`)
- [ ] T8b · Ortoimagen HiRISE 25 cm del recorte (lectura por rangos, como el DTM) para la textura real

## Bloque D — Publicación
- [x] T9 · Assets del terreno servidos por la API en `/assets` (D-29)
- [x] T10 · Semilla `002_jezero_hirise.sql` (región y 6 puntos reales) · generada y probada en local
- [x] T10b · Correr la semilla 002 en Neon · Hecho 15-nov con visto bueno de Dirk; la API publicada responde Jezero real (`hirise-v1`)
- [x] T11 · `/layers` en modo live con las capas que salen del DTM (relieve sombreado y elevación, formato `image`). Ortoimagen, inercia térmica y mineralogía se agregan cuando existan · CE-3 parcial
- [x] T12 · Catálogo de datos y créditos actualizados
