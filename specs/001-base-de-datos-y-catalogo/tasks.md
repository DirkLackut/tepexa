# Spec 001 — Tareas

## Bloque A — Pruebas que fallan
- [x] T1 · Pruebas de migraciones, textos bilingües, semilla, modo live, `/health` y base caída · Hecho cuando: fallan por falta de código · CE-1…CE-5

## Bloque B — Base de datos
- [x] T2 · Migración `001_catalogo.sql` (PostGIS, regiones, hechos, fuentes, capas, puntos de interés) · Hecho cuando: CE-1 y CE-2 pasan en PostgreSQL 16 + PostGIS 3.4 local
- [x] T3 · Generador de la semilla desde `contracts/examples/` y `001_catalogo_ejemplo.sql` · Hecho cuando: la semilla se aplica dos veces sin error

## Bloque C — API en modo live
- [x] T4 · Pool de conexiones, repositorio del catálogo y endpoints live · Hecho cuando: CE-3 pasa
- [x] T5 · `Health.endpoints`, 503 sin detalles, CORS con expresión regular · Hecho cuando: CE-4 y CE-5 pasan
- [x] T6 · Ejemplos, `openapi.json` y `contracts/CHANGELOG.md` actualizados · Hecho cuando: CE-6 pasa (71 pruebas)

## Bloque D — Publicación y entrega
- [x] T7 · `render.yaml`, `.github/CODEOWNERS`, documentación actualizada (hosting Vercel + Render + R2)
- [ ] T8 · Commit en rama `spec/001-base-de-datos` y PR · ⚠ intervención manual (Dirk, VS Code)
- [x] T9 · Aplicar `001_catalogo.sql` y la semilla en Neon (SQL Editor) · ⚠ con visto bueno de Dirk · Hecho 14-nov: 2 regiones, 10 hechos, 11 enlaces hecho-fuente, 6 puntos, 5 enlaces punto-fuente, 3 imágenes, 6 fuentes; `schema_migrations` = `001_catalogo`
- [ ] T10 · Crear el servicio en Render desde el Blueprint y pegar `DATABASE_URL` · ⚠ intervención manual (Dirk)
- [ ] T11 · Lista de comprobación manual en la URL de Render · CE-7
- [ ] T12 · Crear la regla de protección de `main` (hoy no existe): exigir PR y «Require review from Code Owners» · ⚠ intervención manual (Dirk)
