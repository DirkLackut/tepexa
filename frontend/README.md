# Frontend de TEPEXA

**En vivo:** https://tepexa-ruby.vercel.app

App en React 18 + TypeScript + Vite, con OpenLayers (mapa 2D) y React Three Fiber (3D).
Es el diseño del equipo de frontend con los datos reales de la API dentro, módulo por módulo.
**Antes de cambiar algo lean `docs/HANDOFF-FRONTEND.md`** y después `contracts/README.md` y `docs/constitucion.md`.

## Cómo correrla
Necesitan Node 20 o más nuevo.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (tiene que ser ese puerto: es el que la API acepta en desarrollo)
npm run build      # revisa tipos (tsc) y arma dist/
```

Por defecto usa la API publicada (`https://tepexa-api.onrender.com/api/v1`). Para otra API, copien `.env.example`
como `.env.local` y cambien `VITE_API_URL`. Render gratis tarda ~50 s en despertar: la app lo avisa y reintenta.

Si cambia `contracts/openapi.json`: `npm run tipos` (regenera `src/shared/api/types.ts`; no se edita a mano).

## Módulos
| Ruta | Página | Qué usa de la API |
|---|---|---|
| `/` | Entrada (`Landing`) | Logo del equipo (el video de entrada va aquí cuando exista) |
| `/login`, `/register-step-1`, `/forgot-password` | Pantallas de cuenta del diseño del equipo. Llevan a la app; **no crean cuentas** (no hay backend de usuarios) y no guardan datos personales | — |
| `/role` | Rol: estudiante → Atlas; astronauta → Planificador | — |
| `/app` | Martian Atlas (Jezero) | `/regions`, `/layers`, `/pois`, `/terrain`; CRISM, THEMIS y la ortoimagen salen deshabilitadas («próximamente») |
| `/app/planner` | Planificador | `POST /routes/compare`: 3 rutas, perfil de elevación, advertencias |
| `/app/analysis` | Análisis y resultados | Tabla de rutas, geología, fuentes; **guarda** la misión (`POST /missions`) y muestra el informe (`/missions/{id}/report`), imprimible |
| `/app/simulator` | Simulación 3D | Dos mapas: **Jezero** (DTM HiRISE real, rutas de la API) y **Medusae Fossae** (`?mapa=medusae`, terreno **ilustrativo** de yardangs con rutas del mismo modelo de caminata). Tripulante que camina (×15) con casco opcional, dron con aleteo, cámara suave. **Módulo aislado: es posible que cambie (no está decidido)**; ver `src/simulador/LEEME.md` |
| `/app/crew` | Tripulación | Avatares 3D que caminan o están en reposo, con o sin casco; el elegido camina en el simulador, siempre con el dron. |
| `/app/intelligence` | Asistente | Sin IA: respuestas armadas con los datos reales (puntos, rutas, hechos, fuentes) |
| `/app?region=medusae` | Martian Atlas (Medusae Fossae) | Ficha de la región, hechos con su certeza y el modelo del equipo; botón para simular en el terreno ilustrativo. `/app/medusae` redirige aquí |
| `/app/profile` | Perfil | Rol, tripulante, idioma, misiones guardadas en este navegador |

Idioma: el del navegador (español si empieza con `es`, si no inglés); el botón ES/EN lo cambia y se recuerda.

## Estructura
```
src/
  pages/            una página por módulo (diseño del equipo)
  shared/api/       client.ts (fetch y errores {es,en}), endpoints.ts (funciones y tipos), types.ts (generado)
  shared/context/   MisionContext (región, puntos, objetivos, parámetros, rutas, tripulante, rol), LanguageContext
  shared/mapa/      Mapa2D (OpenLayers en metros locales), PerfilElevacion
  shared/3d/        TerrenoJezero, RutaEnTerreno, PuntoDeInteres, ModeloDelEquipo, AvatarArticulado (caminata y casco),
                    DronAnimado (aleteo), coordenadas, alturas
  shared/components/Datos (fuente, certeza, ficha de punto, procedencia), Topbar, VisorModelo…
  simulador/        escena 3D de la EVA (aislada; puede reemplazarse); simulador/medusae/: terreno ilustrativo y sus rutas
public/models/      modelos optimizados + manifest.json (los genera pipeline/assets)
vercel.json         todas las rutas de la app sirven index.html (react-router)
ejemplos/escena-3d/ app de referencia del 3D (spec 005)
```
Sin usar por ahora (del diseño original, se dejan por si el equipo los retoma): `Sidebar`, `StatCard`, `Badge`,
`LoadingScreen`, `ExampleDataBanner`, `TelemetrySidebar`, `CommandSequenceSidebar`. Si los usan, que muestren
solo datos de la API: nada de telemetría inventada.

## Reglas técnicas (para no romper la integración)
1. **Tipos generados, no escritos a mano** (`npm run tipos`).
2. **Una sola URL base:** `VITE_API_URL`. Nunca claves ni la cadena de conexión de la base de datos en el frontend.
3. **Lector tolerante:** ignorar campos desconocidos y mostrar `message` aunque llegue un código nuevo.
4. **`is_example: true`** → etiqueta visible «Datos de ejemplo / Example data». Los modelos artísticos llevan
   «artístico: no es dato de NASA».
5. **Una sola polilínea:** mapa, perfil, simulador e informe usan la ruta que entrega la API. Nadie recalcula rutas.
6. **Bilingüe:** todo texto propio en `{ es, en }` con `t()` de `useLang()`.
7. **3D con carga diferida:** three.js y los modelos solo se cargan al entrar a un módulo que los usa
   (la carga inicial pesa ~250 kB).
8. Cada modelo va en `<Suspense>` y en un *error boundary* con reemplazo: un modelo roto no tumba la página.
9. El contrato solo cambia por PR revisado por el backend; las dudas van a `specs/000-contrato-api/clarificacion.md`.

## Publicar en Vercel
1. En Vercel: **Add New → Project** → importar el repo de GitHub `tepexa`.
2. **Project Name:** que empiece con `tepexa` (por ejemplo `tepexa` o `tepexa-app`): la API solo acepta
   `https://tepexa….vercel.app`.
3. **Root Directory:** `frontend`. Framework: Vite (lo detecta). Build `npm run build`, salida `dist`.
4. **Environment Variables:** `VITE_API_URL` = `https://tepexa-api.onrender.com/api/v1` (no es un secreto).
5. **Deploy.** Cada PR recibe su vista previa y cada unión a `main` publica la app.
6. Prueben `https://<proyecto>.vercel.app/app/planner` y recarguen la página: debe abrir (lo resuelve `vercel.json`).

## Pendientes del equipo
| # | Pendiente | Responsable |
|---|---|---|
| 1 | Video de entrada (MP4 o WebM, menos de 10 MB, fuera del repo si pesa más) que reemplace a Marte girando | Blender |
| 2 | Medir FPS del simulador en laptop, iPhone y Android | Frontend |
| 3 | Cuentas reales (hoy las pantallas no crean usuarios) si se decide que hacen falta | Equipo |
| 4 | Pasar los colores del logo a `docs/identidad-visual.md` | Diseño |
| 5 | Envío a Space Apps: textos en inglés, video de hasta 30 s o 7 diapositivas, declaración de uso de IA, marca de agua en imágenes generadas con IA, sin logos de NASA | Todo el equipo |

## Modelos 3D: cómo entregarlos
1. Exporten el `.glb` (reglas abajo) y déjenlo en `assets/models/originales/` (no se sube a Git).
2. `cd pipeline/assets && npm install` (una vez) y `npm run modelos`.
3. Suban solo lo que cambió en `frontend/public/models/` (con su `manifest.json`), en una rama con PR.
Si el script avisa que un modelo pesa de más, ustedes deciden: simplificarlo en Blender o usarlo igual.

## Reglas para exportar desde Blender
- Material *Principled BSDF* únicamente; texturas horneadas (nada procedural).
- Mallas con UVs; transformaciones aplicadas; escala en metros; eje Y arriba (el exportador glTF lo hace).
- Nada de volumétricos ni transparencias complejas (no se exportan).
- Texturas de 2048 px como máximo.
- Exportar como **glTF Binary (.glb)**. Los `.blend` no se suben al repo.
- Los nombres de los objetos en inglés y sin espacios (`astronaut_body`, `helmet_visor`).
