# TEPEXA — Estado y decisiones

Actualizado: 14 de noviembre de 2026. Es lo primero que se lee al retomar el proyecto. Para el frontend: `docs/HANDOFF-FRONTEND.md`.

## Qué es
App web para NASA Space Apps 2026, reto «Interplanetary Survival Guide: Martian Map».
Equipo de 6 (UAM, Managua). Objetivo de esta etapa: **la demo del evento**.

## Estado de las specs

| Spec | Nombre | Estado |
|---|---|---|
| 000 | Contrato API backend↔frontend | Cerrada (14-nov, `cb1975e`). Falta la revisión del frontend (T8) |
| 001 | Base de datos (Neon + PostGIS), catálogo y publicación en Render | Cerrada (15-nov). API en `https://tepexa-api.onrender.com/api/v1`. CORS listo para `https://tepexa….vercel.app` (variable en Render, 15-nov) |
| 002 | Pipeline de datos (DEM, ortoimagen, inercia térmica, mineralogía) | Parte 1 lista (15-nov): DTM HiRISE real de la Margin Unit, 5 sitios reales de Perseverance, terreno 3D real, `/layers` con relieve y elevación. Semilla 002 aplicada en Neon. Falta (extras): ortoimagen, inercia térmica, mineralogía |
| 003 | Motor de rutas (3 perfiles + regreso) | Cerrada (15-nov): DTM real, ~1.5 s en Render. Extra pendiente: comparar con la travesía de Perseverance (CE-5) |
| 004 | Análisis de misión e informe | Cerrada (15-nov): misiones, informe y límite por IP verificados en Render v0.5.0 |
| 005 | Manifiesto del terreno 3D | Cerrada (15-nov): `/terrain` en vivo con 2 niveles y escena de referencia en `frontend/ejemplos/escena-3d/`. Extra: textura con la ortoimagen real |
| 006 | Pipeline de assets 3D (Blender) y Rive | Cerrada (15-nov): optimizador, revisión automática en cada PR, 10 modelos optimizados y comparación de calidad; `backend/render/` sale del repo; el dron se queda con su aviso en móvil; la prueba con Blender MCP se descarta |
| — | Frontend integrado | 15-nov: diseño del equipo con los datos reales en `frontend/` (Atlas, Planificador, Análisis e informe, Simulador, Tripulación, Asistente, Medusae, Perfil). La simulación 3D es un módulo aislado; es posible que cambie (no está decidido) (`frontend/src/simulador/LEEME.md`); mapas: Jezero (real) y Medusae Fossae (ilustrativo). Publicado en https://tepexa-ruby.vercel.app (15-nov). Falta: medir FPS en celulares |

Las specs 002 a 006 tienen `spec.md` y `tasks.md` en borrador; se completan con `clarificacion.md`
y `plan.md` al abrir cada una. Datos de NASA: `docs/datos/catalogo-de-datos.md`.

## Decisiones de producto

| Tema | Decisión |
|---|---|
| Nombre | TEPEXA — *Explore the Unknown* |
| Usuario de la demo | Estudiante (explora) y astronauta (planifica y simula) |
| Región principal | Jezero, Margin Unit. Objetivo de la EVA: las rocas con carbonato donde Perseverance tomó muestras (Pelican Point, Lefroy Bay, Comet Geyser, Old Faithful Geyser) y, opcional, Eremita Mesa. Los episodios 2 y 3 quedan como hechos de la región: las fuentes no dan rocas concretas |
| Región extra | Medusae Fossae como **avance completo** de «próxima misión»: ficha, hechos con certeza y terreno del equipo; **sin cálculo de rutas** |
| Datos | DTM HiRISE (mosaico Mars 2020 del USGS) recortado a la Margin Unit; puntos de interés = sitios de muestra de Perseverance. Pendientes: ortoimagen, inercia térmica (THEMIS), mineralogía (CRISM), fotos |
| Costo de ruta | Pendiente máxima 20° (filtro) + tiempo con traje (Tobler a 2 km/h en llano, ritmo de NASA) + suelo suelto (inercia térmica) + ruta de regreso; EVA de 6 h. Valores de referencia lunares de NASA: no hay oficiales para Marte |
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
| D-6 | Neon (PostgreSQL 18.7 + PostGIS 3.6.4), AWS US East 1 | Gratis, cerca de Render Virginia |
| D-7 | Vercel (frontend, equipo) + Render (API) + Cloudflare R2 (archivos pesados). Google Cloud y Porkbun descartados (14-nov) | Gratis; lo decidió el equipo |
| D-11 a D-19 | Ver `specs/001-base-de-datos-y-catalogo/plan.md` | Migraciones SQL, psycopg, textos jsonb, modo live por endpoint, Render, CORS |
| D-20 a D-27 | Ver `specs/003-motor-de-rutas/plan.md` | Dijkstra (SciPy), rejilla de 10 m, `tobler-eva-v1`, 20° y 360 min con fuente de NASA, costos por perfil |
| D-35 | Ver `specs/003-motor-de-rutas/plan.md` | Búsqueda de rutas por ventana: ~1.5 s en Render |
| D-36 a D-39 | Ver `specs/006-assets-3d-y-rive/plan.md` | glTF-Transform, originales fuera de Git, presupuesto como aviso, reemplazo si un modelo falla |
| D-40 a D-42 | Ver `specs/005-terreno-3d/plan.md` | Terreno servido por la API (no R2), escena de referencia aparte en `frontend/ejemplos/`, heightmap de 16 bits con `upng-js` |
| D-43 | Ver `specs/006-assets-3d-y-rive/plan.md` | Tripo: Smart Mesh o Retopology; el optimizador no reduce modelos livianos |
| D-32 a D-34 | Ver `specs/004-misiones-e-informe/plan.md` | Ruta en jsonb, límite por IP y tope de misiones, error RATE_LIMITED |
| D-28 a D-31 | Ver `specs/002-pipeline-de-datos/plan.md` | Recorte 4 × 3 km leído por rangos (sin descargar), terreno servido por la API, semilla 002 aparte |
| D-44 | Frontend: el diseño del equipo como cascarón y las piezas reales adentro, módulo por módulo | Se conserva el trabajo visual del equipo y cada pantalla muestra datos de la API con su fuente |
| D-45 | Pantallas de cuenta sin crear usuarios (sin aviso de demo, a pedido de Dirk); sin campos médicos ni datos personales. Medusae Fossae pasa al Atlas como segunda región | Principio de datos mínimos; no hay backend de usuarios |
| D-46 | Asistente sin IA: respuestas armadas con los datos reales | Nada inventado; sin costo ni claves en el frontend |
| D-47 | Simulador aislado en `frontend/src/simulador/` con contrato propio | Puede cambiar sin tocar el resto de la app |
| D-48 | Dependencias del frontend: three 0.170.0, @react-three/fiber 8.17.10, @react-three/drei 9.117.3, ol 10.2.1, upng-js 2.1.0, openapi-typescript 7.4.4 (dev) | Las mismas que la escena de referencia (spec 005) |
| D-49 | Mapa de simulación de Medusae Fossae **ilustrativo** (yardangs generados en el navegador, `is_example: true`) con rutas del mismo modelo de caminata que la API | La API no tiene DTM de Medusae; permite ensayar la próxima misión sin presentar nada como dato de NASA. Se reemplaza cuando el backend tenga un DTM real |
| D-50 | Avatares animados en el sombreador de vértices (piernas, brazos, torso) y casco medido sobre cada modelo; tripulante a escala ×15 | Los modelos de Tripo no tienen esqueleto; sin descargas extra ni costo de rendimiento |

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
Las crea y administra **Dirk**; el equipo entra como miembro. Ninguna clave va al repo ni al chat.
- GitHub: `DirkLackut/tepexa`, público; colaboradores IsraDev29, Quokka-JOne, Gasparin-12,
  Alejandro17Cast, G-Yasid. `main` protegida: todo entra por PR con 1 aprobación de Code Owners (Dirk aprueba backend; `contracts/` Dirk o IsraDev29; `frontend/` y `assets/` el equipo).
- Neon: organización `TEPEXA`, proyecto `tepexa` (`floral-king-93600340`), rama `production`,
  AWS US East 1.
- Cloudflare: cuenta de Dirk (R2 para archivos pesados).
- Render: cuenta de Dirk con GitHub (Blueprint `tepexa`, servicio `tepexa-api`, región Virginia, publica solo en cada merge a `main`). URL: `https://tepexa-api.onrender.com`.
- Vercel y dominio: los maneja el equipo de frontend y diseño.

## Dónde corre cada cosa
- **En el entorno de trabajo en la nube:** specs, código del backend, pruebas, procesamiento
  de datos.
- **En la PC de Dirk** (`C:\Users\ALUMNO\Desktop\TEPEXA`): descarga de datos de NASA, commits y
  push (desde VS Code), pegar secretos en `.env.local` y en Render.
- **Neon:** las migraciones y semillas se pegan en el SQL Editor de la consola (la nube de
  desarrollo no llega a Neon por red).
- **Render:** la API publicada; lee la cadena de conexión de sus variables de entorno.
- **Frontend:** PCs del equipo y Vercel; fase 1 con los JSON de `contracts/examples`, fase 2 con
  la URL de Render.

## Plan B de la defensa
- Render gratis se duerme tras 15 min sin uso: abrir `/api/v1/health` un minuto antes de presentar.
- Video grabado del flujo completo y la app corriendo en una laptop.

## Lecciones
- Spec 001: en el SQL Editor de Neon el clic sintético no siempre ejecuta; verificar siempre con una consulta de conteo después de correr.
- Spec 001: los modelos 3D del equipo entraron en `backend/render/` (Crater, mars, Medusa: ~28 MB). Spec 006 (15-nov): salen del repo; las versiones nuevas están en `frontend/public/models/`.
- Render vuelve a publicar en cada merge, aunque solo cambien assets: falta `buildFilter` en `render.yaml`. (Resuelto en el PR #4.)
- Spec 002: no hizo falta descargar 1.8 GB. El GeoTIFF del USGS acepta lecturas por rango y se leyó solo el recorte desde el navegador integrado; el puente de herramientas corta cada respuesta en ~250 KB, así que los datos viajan comprimidos y en partes.
