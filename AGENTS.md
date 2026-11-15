# AGENTS.md — TEPEXA

## Proyecto
TEPEXA — *Explore the Unknown*. Aplicación web para el reto NASA Space Apps 2026
«Interplanetary Survival Guide: Martian Map». Un estudiante explora capas científicas de
una región de Marte; un astronauta planifica y simula una caminata (EVA) entre objetivos
científicos, comparando rutas calculadas sobre un modelo de elevación real.

- Región principal: cráter Jezero, Margin Unit. Región de avance: Medusae Fossae.
- `backend/` (Python + FastAPI) lo construye Dirk. `frontend/` (React + Vite +
  OpenLayers + React Three Fiber) lo construye el resto del equipo.
- El acuerdo entre ambos lados es `contracts/` (spec 000). Nadie lo cambia sin PR revisado
  por el otro lado.

## Antes de tocar código
1. Lee `docs/constitucion.md`.
2. Lee la spec activa en `specs/` (spec.md → clarificacion.md → plan.md → tasks.md).
3. Lee `docs/estado-y-decisiones.md`: qué está hecho y qué se decidió.

## Comandos (backend)
- Instalar: `pip install -r backend/requirements-dev.txt`
- Pruebas: `pytest -q backend/tests` (las de base de datos necesitan `TEST_DATABASE_URL`)
- Servidor local (modo ejemplo): `uvicorn app.main:app --reload --app-dir backend`
- Regenerar ejemplos y OpenAPI: `python contracts/tools/generar_ejemplos.py`
- Regenerar la semilla del catálogo: `python backend/db/tools/generar_semilla.py`
- Migraciones: archivos nuevos en `backend/db/migrations/`; las aplicadas no se editan.

## Reglas
- Identificadores de código en inglés. Documentos en español. Textos para el usuario siempre
  en los dos idiomas: `{ "es": "...", "en": "..." }`.
- Pruebas primero: el caso que falla se escribe antes del código.
- No cambies `contracts/` ni las specs sin pedirlo explícitamente.
- No añadas dependencias sin anotarlas en el `plan.md` de la spec activa.
- Coordenadas: marco local en metros por región. Nunca EPSG:4326, EPSG:3857 ni `geography`.
- Nunca presentes un dato de ejemplo como dato de NASA: los ejemplos llevan `is_example: true`.
- Secretos solo en `.env.local` (no se sube). Nunca en el código ni en el chat.
- Sin datos personales en el repo. Los avatares parecidos a personas requieren consentimiento.

## Al terminar cualquier tarea
- Ejecuta `pytest -q backend/tests` y confirma que todo pasa.
- Si cambió el contrato, regenera `contracts/openapi.json` y los ejemplos.
