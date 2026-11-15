# Spec 003 — Tareas

## Bloque A — Parámetros con fuente
- [x] T1 · Pendiente máxima, tiempo de EVA y velocidad con traje · Hecho 15-nov: 20°, 360 min, 2 km/h en llano (`clarificacion.md` 1–6)

## Bloque B — Pruebas que fallan
- [x] T2 · Grillas sintéticas: camino conocido, NoData, sin ruta, diagonales, pendiente límite · CE-1, CE-3 (`test_routing.py`)
- [x] T3 · Propiedades de los perfiles · CE-2

## Bloque C — Motor
- [x] T4 · Grafo desde la rejilla con máscara NoData y filtro de pendiente (`routing/engine.py`)
- [x] T5 · Funciones de costo: distancia, `tobler-eva-v1`, suelo suelto y pendiente (D-24)
- [x] T6 · Búsqueda óptima: Dijkstra de SciPy (D-20)
- [x] T7 · Métricas, tramos, perfil de elevación y advertencias (D-25)
- [x] T8 · Ruta de regreso, límite de EVA y recomendación (D-26)

## Bloque D — API y verificación
- [x] T9 · `/routes/compare` en modo live sobre terreno sintético · RF-003-01..03 (`test_routes_api.py`)
- [x] T9b · Ejemplos de `contracts/` y semilla regenerados con el motor (D-27)
- [ ] T9c · Volver a correr la semilla en Neon (nuevos `route_defaults`) · ⚠ con visto bueno de Dirk
- [ ] T10 · Medición de tiempo en Render · CE-4. 15-nov, v0.4.0: 3.1–3.3 s por comparación (5.8 s la primera). Se agregó caché de grafos por parámetros y gzip (local: 0.32 s). Falta volver a medir
- [ ] T11 · Pasar al DTM real cuando la spec 002 lo entregue (`routing/provider.py`)
- [ ] T12 · Comparación con la travesía de Perseverance · CE-5 (necesita `M20_waypoints.json`)
