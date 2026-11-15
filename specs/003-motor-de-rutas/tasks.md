# Spec 003 — Tareas (borrador)

## Bloque A — Parámetros con fuente
- [ ] T1 · Investigar pendiente máxima, tiempo de EVA y factor de velocidad con traje · Hecho cuando: cada valor tiene fuente en `clarificacion.md`

## Bloque B — Pruebas que fallan
- [ ] T2 · Grillas sintéticas: camino conocido, NoData, sin ruta, diagonales, pendiente límite · CE-1, CE-3
- [ ] T3 · Propiedades de los perfiles · CE-2

## Bloque C — Motor
- [ ] T4 · Grafo desde el DTM con máscara NoData y filtro de pendiente
- [ ] T5 · Funciones de costo: distancia, Tobler-Marte, suelo suelto
- [ ] T6 · A\* con heurística admisible por perfil
- [ ] T7 · Métricas, tramos, perfil de elevación y advertencias
- [ ] T8 · Ruta de regreso y límite de EVA

## Bloque D — API y verificación
- [ ] T9 · `/routes/compare` en modo live · RF-003-01..03
- [ ] T10 · Medición de tiempo en Render · CE-4
- [ ] T11 · Comparación con la travesía de Perseverance · CE-5
