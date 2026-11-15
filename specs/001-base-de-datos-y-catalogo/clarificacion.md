# Spec 001 — Clarificaciones

| # | Duda | Respuesta | Fuente | Fecha | Certeza |
|---|---|---|---|---|---|
| 1 | ¿Dónde se publica la API? | Render, plan Free, región Virginia. Google Cloud descartado | Dirk, 14-nov | 14-nov | Confirmado |
| 2 | ¿Dónde se publica el frontend? | Vercel; lo maneja el equipo | Dirk, 14-nov | 14-nov | Confirmado |
| 3 | ¿Dominio propio? | Subdominios gratuitos (`*.vercel.app`, `*.onrender.com`); un dominio propio lo decide diseño | Dirk, 14-nov | 14-nov | Confirmado |
| 4 | ¿Archivos pesados? | Cloudflare R2 (cuenta de Dirk) | Dirk, 14-nov | 14-nov | Confirmado |
| 5 | ¿Cómo se aplican migraciones en Neon si la nube de desarrollo no llega a Neon? | Pegando el SQL en el SQL Editor de la consola de Neon, con visto bueno de Dirk | Prueba de red, 14-nov | 14-nov | Confirmado |
| 6 | ¿Alembic? | No: migraciones SQL numeradas con tabla `schema_migrations`. Se pueden pegar en el SQL Editor y probar igual en local | Lógica (punto 5) | 14-nov | Confirmado |
| 7 | ¿Los puntos de interés ya son reales? | No: se cargan las ubicaciones de ejemplo con `is_example = true`; la spec 002 las reemplaza | Lógica | 14-nov | Confirmado |
| 8 | ¿Quién crea las cuentas? | Dirk; el equipo entra como miembro | Dirk, 14-nov | 14-nov | Confirmado |
| 9 | Render gratis se duerme a los 15 min | Antes de la defensa se abre `/health` una vez; anotado en el plan B | Documentación de Render | 14-nov | Confirmado |
| 10 | Base local de pruebas | PostgreSQL 16 + PostGIS 3.4. Neon resultó ser PostgreSQL 18.7 con PostGIS 3.6.4 disponible (consulta de solo lectura, 14-nov). Se usa solo SQL compatible con ambos | Consulta en Neon | 14-nov | Confirmado |
