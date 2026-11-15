# Cambios del contrato

Solo cambios que agregan dentro de `/api/v1` (ver «Compatibilidad» en `contracts/README.md`).

## 0.2.0 — spec 001 (14-nov-2026)
- `Health.endpoints` (nuevo, opcional): por endpoint, `live` si ya responde con datos reales o
  `example` si sigue con datos de ejemplo.
- En modo `live`, `/regions`, `/regions/{id}` y `/regions/{id}/pois` leen de la base. Su forma no
  cambia.

## 0.1.0 — spec 000 (14-nov-2026)
- Contrato inicial: regiones, capas, puntos de interés, terreno, rutas, misiones, informe,
  errores y advertencias.
