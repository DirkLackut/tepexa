# Spec 004 — Plan

- Migración `backend/db/migrations/002_misiones.sql`: tabla `missions` (id `m-…`, región, perfil, tripulación,
  petición, parámetros, ruta en `jsonb`, versiones). Sin datos personales.
- `backend/app/missions.py`: armar (recalcula la ruta), guardar, leer, informe y límite por IP.
- `POST /missions` → 201 `Mission`; `GET /missions/{id}`; `GET /missions/{id}/report`.
- En modo ejemplo sigue respondiendo `example-mission-0001`.

| ID | Decisión | Motivo |
|---|---|---|
| D-32 | Ruta en `jsonb`, no en `geometry` | Se lee entera; menos código y mismo formato que la API |
| D-33 | Límite en memoria por IP (10 / 10 min) + tope de 2000 misiones | Render gratis tiene una sola instancia; la base gratuita de Neon es de 0.5 GB |
| D-34 | Nuevo código de error `RATE_LIMITED` (HTTP 429) | Cambio que agrega, permitido en v1 |
