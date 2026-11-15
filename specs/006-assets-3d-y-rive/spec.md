# Spec 006 — Pipeline de assets 3D y Rive

Estado: En curso (optimizador listo; falta probar con los modelos de Tripo y acordar la mudanza de `backend/render/`)
Depende de: —
Cubre: los modelos que exporta el equipo desde Blender y los avatares de Rive.

## Problema
El equipo produce modelos en Blender y avatares en Rive. Para la web deben llegar livianos,
sin errores de exportación y con peso medido.

## Requisitos (EARS)
- **RF-006-01** CUANDO se entregue un `.glb`, el pipeline DEBE validarlo (UVs, materiales, transformaciones, texturas ≤ 2048 px) y reportar los problemas.
- **RF-006-02** El pipeline DEBE comprimirlo (meshopt y WebP/KTX2) y reportar el peso antes y después.
- **RF-006-03** Los archivos optimizados DEBEN quedar en `frontend/public/models/` con un `manifest.json`; si un modelo crece demasiado, en R2.
- **RF-006-05** Un modelo que falte, falle o pese demasiado NO DEBE romper la app: el frontend usa un reemplazo simple y sigue.
- **RF-006-04** Los avatares parecidos a integrantes requieren consentimiento escrito (principio 12).

## Criterios de aceptación
| ID | Criterio |
|---|---|
| CE-1 | `mars.glb` y `Crater.glb` pasan por el pipeline y quedan bajo 1 MB cada uno |
| CE-2 | El reporte detecta los problemas encontrados el 14-nov (capas opacas, sin UVs, color usado como relieve) |
| CE-3 | Captura del modelo optimizado en three.js junto al original |
