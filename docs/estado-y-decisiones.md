# TEPEXA — Estado y decisiones

Actualizado: 14 de noviembre de 2026. Es lo primero que se lee al retomar el proyecto.

## Qué es
App web para NASA Space Apps 2026, reto «Interplanetary Survival Guide: Martian Map».
Equipo de 6 (UAM, Managua). Objetivo de esta etapa: **la demo del evento**.

## Estado de las specs

| Spec | Nombre | Estado |
|---|---|---|
| 000 | Contrato API backend↔frontend | Lista: 55 pruebas pasan. Falta subirla (T7) y la revisión del frontend (T8) |
| 001 | Base de datos (Neon + PostGIS) y catálogo | Pendiente |
| 002 | Pipeline de datos (DEM, ortoimagen, inercia térmica, mineralogía) | Pendiente |
| 003 | Motor de rutas (3 perfiles + regreso) | Pendiente |
| 004 | Análisis de misión e informe | Pendiente |
| 005 | Manifiesto del terreno 3D | Pendiente |

## Decisiones de producto

| Tema | Decisión |
|---|---|
| Nombre | TEPEXA — *Explore the Unknown* |
| Usuario de la demo | Estudiante (explora) y astronauta (planifica y simula) |
| Región principal | Jezero, Margin Unit: la EVA recorre los 3 episodios de agua (Bedford et al., 2026) |
| Región extra | Medusae Fossae como **avance completo** de «próxima misión»: ficha, hechos con certeza y terreno del equipo; **sin cálculo de rutas** |
| Datos | Ortoimagen y DEM HiRISE (~1 m), inercia térmica (THEMIS), mineralogía orbital (CRISM), fotos de Perseverance |
| Costo de ruta | Pendiente máxima (filtro) + tiempo con traje (Tobler ajustada a Marte) + suelo suelto (inercia térmica) + ruta de regreso |
| Perfiles | Más corta, más rápida, más segura |
| Simulador | 3D central (R3F) con cámaras en tercera persona y primera persona con HUD; 2D como minimapa y respaldo |
| Móvil | Todo disponible, 3D incluido en versión liviana |
| Entrada | Video de animación automático con el globo (equipo, Blender) |
| Avatares | Rive, cuerpo completo, sin máquina de estados (los entrega el equipo) |
| Idiomas | Español e inglés. La API entrega **siempre los dos** (`{es, en}`); el idioma por defecto lo decide el frontend |
| Informe | El backend entrega los datos; el frontend lo muestra (y lo imprime si se decide) |
| PWA | Sí, solo online |
| Plan B de la defensa | Video grabado + app corriendo en una laptop |

**Conflictos registrados (no bloquean el backend):**
- Idioma por defecto: Dirk dijo español; el equipo dijo inglés. Lo resuelve el frontend.
- Informe: Dirk dijo pantalla y descarga; el equipo dijo solo pantalla. El backend sirve igual.

## Decisiones técnicas

| ID | Decisión | Motivo |
|---|---|---|
| D-1 | Python + FastAPI para el backend | Ecosistema geoespacial (Rasterio, NumPy) y OpenAPI automático |
| D-2 | Contrato con modelos Pydantic; `contracts/openapi.json` generado de ellos | Una sola fuente de verdad, sin desincronizar |
| D-3 | Textos para el usuario como `{es, en}` | App bilingüe sin segunda llamada |
| D-4 | Marco local en metros por región; origen en la esquina suroeste del recorte | Medir en Marte sin geodesia terrestre |
| D-5 | Respuestas de ejemplo con `is_example: true` | Principio 1: nada sintético se confunde con dato real |
| D-6 | Neon (PostgreSQL 17 + PostGIS), AWS US East 1 | Gratis, cerca de Cloud Run |
| D-7 | Cloudflare (frontend) + R2 (assets) + Cloud Run (API) + dominio de Porkbun | Gratis o con créditos del evento |

## Assets de Blender y Rive
- **Formato de trabajo:** `.blend` (lo sigue usando el equipo en Blender; no va a Git).
- **Formato para la web:** `.glb` (glTF binario). three.js / R3F lo carga directamente con
  `useGLTF`. Reglas de exportación: Principled BSDF, texturas horneadas, UVs, sin volumétricos,
  transformaciones aplicadas, texturas de 2K como máximo.
- **Optimización:** `pipeline/assets` (pendiente) toma cada `.glb` exportado, lo comprime
  (meshopt, WebP/KTX2), lo valida (peso, triángulos, UVs, materiales) y lo deja listo para R2.
- **Rive:** `.riv` exportado para la web, cargado con el runtime oficial de Rive para React.
- El terreno de las rutas **siempre** sale del DEM (principio 3).

## Cuentas
Dueño: **Israel**. Respaldo: **Jasury**.
- Neon: organización `TEPEXA`, proyecto `tepexa` (`floral-king-93600340`), rama `production`,
  AWS US East 1. Creado por Dirk el 14-nov.
- Cloudflare, Google Cloud (créditos de US$300 por 90 días), dominio en Porkbun: pendientes.

## Dónde corre cada cosa
- **En el entorno de trabajo en la nube:** specs, código del backend, pruebas, procesamiento
  de datos.
- **En la PC de Dirk** (`C:\Users\ALUMNO\Desktop\TEPEXA`): descarga de datos de NASA, commits y
  push (desde VS Code), pegar secretos en `.env.local`.
- **Frontend:** PCs del equipo; fase 1 con los JSON de `contracts/examples`, fase 2 con la API en
  Cloud Run.

## Lecciones
(Se llenan al cerrar cada spec.)
