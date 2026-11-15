# Spec 000 — Tareas

## Bloque A — Pruebas que fallan
- [x] T1 · Pruebas de validación de ejemplos, OpenAPI, endpoints, errores, consistencia de ruta
  y textos bilingües · Hecho cuando: `pytest` falla porque no existen modelos ni ejemplos · CE-1…CE-6

## Bloque B — Modelos y API
- [x] T2 · Modelos Pydantic del contrato en `backend/app/contract/` · Hecho cuando: importan sin error
- [x] T3 · API en modo ejemplo con errores bilingües · Hecho cuando: CE-3 y CE-4 pasan

## Bloque C — Ejemplos y OpenAPI
- [x] T4 · Generador de ejemplos con ruta calculada desde un terreno sintético · Hecho cuando: CE-1, CE-5 y CE-6 pasan
- [x] T5 · `contracts/openapi.json` generado · Hecho cuando: CE-2 pasa

## Bloque D — Entrega al frontend
- [x] T6 · `contracts/README.md`: qué endpoint usa cada pantalla y cómo leer los datos · CE-7
- [ ] T7 · Commit y push desde la PC (VS Code) · ⚠ intervención manual
- [ ] T8 · El equipo de frontend revisa `contracts/README.md` y deja sus dudas · ⚠ intervención manual
