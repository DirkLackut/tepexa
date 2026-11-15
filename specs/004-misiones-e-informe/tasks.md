# Spec 004 — Tareas

- [x] T1 · Pruebas: guardar, leer, informe, límites · CE-1..3 (`test_db_hirise.py`, `test_routes_api.py`)
- [x] T2 · Migración `002_misiones.sql` · probada en PostgreSQL local
- [x] T2b · Aplicar `002_misiones.sql` en Neon · Hecho 15-nov con visto bueno de Dirk (`schema_migrations` = 001, 002)
- [x] T3 · Guardar misión recalculando la ruta
- [x] T4 · Informe con fuentes, supuestos y limitaciones
- [x] T5 · Límite de peticiones y de tamaño
- [x] T6 · Lista manual en Render (15-nov, v0.5.0): guardar → 201 en 1.3 s; leer devuelve el mismo contenido; informe con los 4 objetivos por nombre, 4 fuentes y 3 limitaciones; id inexistente → 404. Las 2 misiones de prueba se borraron después con visto bueno de Dirk
