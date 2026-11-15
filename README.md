# TEPEXA — Explore the Unknown

Aplicación web para el reto **Interplanetary Survival Guide: Martian Map** de NASA Space
Apps Challenge 2026. Combina datos de varias misiones de NASA sobre el cráter Jezero para
explorar capas científicas, comparar rutas de una caminata (EVA) hacia objetivos científicos
y simularla en 3D.

> Planificación conceptual y educativa. No es un sistema certificado para operaciones reales.

## Estructura

| Carpeta | Contenido | Responsable |
|---|---|---|
| `contracts/` | Contrato de la API: `openapi.json` y JSON de ejemplo | Backend (cambios con revisión del frontend) |
| `backend/` | API en Python + FastAPI | Backend |
| `frontend/` | App en React + Vite + OpenLayers + React Three Fiber | Frontend |
| `pipeline/` | Procesamiento de datos y optimización de assets | Backend |
| `assets/` | Assets livianos (miniaturas); los pesados van a almacenamiento externo | Equipo |
| `specs/` | Specs de SDD | Dueño del SDD |
| `docs/` | Constitución, estado, idea, identidad visual, método SDD | Dueño del SDD |

## Para el frontend: empezar hoy
Lee `contracts/README.md`. Los archivos de `contracts/examples/` son exactamente lo que
devolverá cada endpoint; se puede programar contra ellos antes de que la API esté publicada.

## Backend
```
pip install -r backend/requirements-dev.txt
pytest -q backend/tests
uvicorn app.main:app --reload --app-dir backend
```
Con `TEPEXA_MODE=example` (por defecto) la API sirve los ejemplos del contrato. Con
`TEPEXA_MODE=live` y `DATABASE_URL`, los endpoints ya implementados leen de la base
(`/api/v1/health` → `endpoints`). Documentación interactiva en `http://localhost:8000/docs`.

- **Base de datos:** migraciones en `backend/db/migrations/`, semillas en `backend/db/seeds/`.
- **Publicación:** Render, con `render.yaml` (Blueprint).
- **Pruebas de base:** definir `TEST_DATABASE_URL` (PostgreSQL con PostGIS que se pueda vaciar).

| Pieza | Dónde |
|---|---|
| Frontend | Vercel |
| API | Render |
| Base de datos | Neon (PostgreSQL + PostGIS) |
| Archivos pesados | Cloudflare R2 |

## Método
Spec-Driven Development (`docs/METODO-SDD.md`). Lee `AGENTS.md` antes de pedirle algo a una IA.
