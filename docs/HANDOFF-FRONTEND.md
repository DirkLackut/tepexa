# TEPEXA — Traspaso backend → frontend

> **Si eres un agente de IA (Claude Code, Codex, Cursor, ChatGPT…) trabajando en el frontend: lee este
> archivo completo antes de escribir código.** Después lee `contracts/README.md`, `docs/constitucion.md`
> y `frontend/README.md`. Si algo de aquí contradice al código del backend, manda el código y avisa al equipo.

Actualizado: **15-nov-2026, API v0.5.0**. Lo mantiene el backend (Dirk). Cada PR que cambie la API
actualiza la sección 2 y la 7. El equipo de frontend actualiza la sección 8.

---

## 1. Qué es TEPEXA en una línea
App web para NASA Space Apps 2026 («Interplanetary Survival Guide: Martian Map»): un estudiante explora
la Margin Unit del cráter Jezero con datos reales de NASA; un astronauta planifica una caminata (EVA),
compara tres rutas, la simula en 3D y recibe un informe. Medusae Fossae aparece como «próxima misión».

## 2. Estado de la API

**URL base:** `https://tepexa-api.onrender.com/api/v1` → en el frontend: `VITE_API_URL`.
Documentación interactiva: `https://tepexa-api.onrender.com/docs`.

| Pantalla | Método y ruta | Estado | Datos |
|---|---|---|---|
| Arranque / estado | `GET /health` | ✅ | `endpoints` dice `live` o `example` por endpoint |
| Lista de regiones, «próxima misión» | `GET /regions` | ✅ | Jezero (activa) y Medusae (avance) |
| Ficha de región | `GET /regions/{id}` | ✅ | Jezero real; Medusae con hechos reales y fuentes |
| Mapa: capas | `GET /regions/jezero-margin/layers` | ✅ | Relieve sombreado y elevación del DTM (imágenes) |
| Mapa: puntos de interés | `GET /regions/jezero-margin/pois` | ✅ | Base + 5 sitios reales de Perseverance |
| Simulador 3D | `GET /regions/jezero-margin/terrain` | ✅ | Heightmap PNG 16 bits (2 m y 4 m) + textura de relieve |
| Planificar | `POST /routes/compare` | ✅ | 3 perfiles sobre el DTM HiRISE real, con regreso |
| Guardar misión | `POST /missions` | ✅ | Recalcula la ruta en el servidor; devuelve `id` (`m-…`) |
| Ver misión / informe | `GET /missions/{id}`, `GET /missions/{id}/report` | ✅ | Informe con objetivos, fuentes, supuestos y limitaciones |

Si alguna vez una parte de la base no está lista, la API responde 503 `DATASET_UNAVAILABLE`: muestren
`message` y un botón para reintentar.

**Sin la API** (sin internet, o Render caído): usen `contracts/examples/*.json`. Ojo: esos ejemplos son
el **terreno sintético**; los `id` y las coordenadas de los puntos de interés no son los reales.

## 3. Datos reales que entrega hoy

- **Región:** recorte de 4 × 3 km centrado en 18.487° N, 77.325° E. Elevación de −2443.1 a −1995.0 m.
- **Terreno:** DTM HiRISE de 1 m del USGS (Fergason et al., 2020). Se verificó contra Perseverance:
  en los 5 sitios la altura coincide con un error de 1 a 19 cm.
- **Puntos de interés** (`id` estables, úsenlos tal cual):

| id | Qué es | x, y (m) |
|---|---|---|
| `base` | Base de la misión (la eligió el equipo; **no** es un sitio de NASA) | 2950, 1100 |
| `pelican-point` | Núcleo con carbonato, sol 923 | 3444.4, 1289.1 |
| `lefroy-bay` | Núcleo con carbonato, sol 942 | 3239.2, 1601.6 |
| `comet-geyser` | Núcleo con carbonato, sol 1088 | 2123.8, 1786.5 |
| `old-faithful-geyser` | Abrasión con carbonato, sol 1151 | 1358.6, 1720.0 |
| `eremita-mesa` | Última parada antes de subir al borde (opcional) | 511.4, 1543.3 |

- **Misión sugerida** (la del objetivo de la región): base → Pelican Point → Lefroy Bay → Comet Geyser →
  Old Faithful Geyser → regreso. Son 4.8 km y 2 h 29 min, dentro del límite de 6 h, con pendiente
  máxima de 9°. Con Eremita Mesa: ~6.5 km y ~3 h 30 min.
- **Límites por defecto** (vienen en `route_defaults`): pendiente máxima 20°, EVA de 360 min, 2 km/h
  en llano. Son referencias lunares de NASA, y la app debe decirlo así.

## 4. Cómo usar los datos (lo que más se rompe)

1. **Coordenadas = metros locales**, no lat/lon: `x` al este, `y` al norte, origen en la esquina
   suroeste, `extent = [0, 0, 4000, 3000]`.
   - OpenLayers: `new Projection({ code: 'jezero-local', units: 'm', extent })`. Las capas con
     `tiles.format = "image"` se cargan con `ImageStatic({ url, imageExtent: extent, projection })`.
   - Los puntos de interés son GeoJSON `Point` en ese mismo marco.
2. **3D (R3F):** `heightmap` es un PNG de **16 bits**. Altura: `z = z_min_m + valor/65535·(z_max_m − z_min_m)`.
   La fila 0 de la imagen es el **norte**. Cárguenlo como datos de 16 bits (por ejemplo, decodificando
   el PNG con `UPNG.js`), no como textura de 8 bits, o se pierde el relieve. Usen `scene_transform`
   (eje Y arriba, `units_per_meter`). Hay dos niveles en `lods[]`: `desktop` (2001 × 1501) y
   `mobile` (1001 × 751).
3. **Rutas:** cada perfil trae `outbound.polyline` como `[x, y, z]`. **La misma polilínea** se dibuja en
   el mapa, el minimapa, el 3D y el informe; nadie recalcula rutas en el navegador. `legs[]` dice en qué
   vértice empieza y termina cada tramo. `elevation_profile` sirve para el gráfico.
4. **Tiempos:** `/routes/compare` tarda 3–5 s en Render. Muestren «calculando…» y no permitan doble envío.
   **Primera llamada:** si nadie usó la API en 15 min, Render tarda ~50 s en despertar. Llamen a
   `/health` al abrir la app y muestren un estado de carga.
5. **Guardar y ver el informe:** `POST /missions` con `{name, route_request, selected_profile, crew}`
   devuelve `201` con `id`. Después, `GET /missions/{id}/report`. `crew` son solo ids de avatar Rive,
   **nunca nombres de personas**. Si llega 429 `RATE_LIMITED`, muestren `message` y esperen
   `details.retry_after_s`.
6. **Errores y advertencias:** siempre traen `message: {es, en}`; muéstrenlo tal cual. Los códigos están en
   `contracts/README.md`. Lector tolerante: si llega un código o campo nuevo, no se rompe.
7. **Honestidad (constitución):**
   - Etiqueta visible «Datos de ejemplo / Example data» cuando `is_example` sea `true`.
   - El aviso `disclaimer` va siempre en planificar y en el informe.
   - Cada capa y punto muestra su `source`/`evidence`.
   - Los hechos muestran su `certainty` (`confirmed`, `interpretation`, `hypothesis`).
8. **Bilingüe:** la API trae `{es, en}`; sus textos propios también deben existir en los dos idiomas.
9. **Tipos:** `npx openapi-typescript contracts/openapi.json -o frontend/src/shared/api/types.ts`. No los
   escriban a mano.
10. **CORS:** hoy solo `http://localhost:5173`. Pásenle a Dirk la URL de Vercel (producción y patrón de
    vistas previas) para habilitarla.

## 5. Medusae Fossae (próxima misión)
`status: "preview"`: ficha y 6 hechos con certeza y fuentes. No tiene capas, terreno ni rutas: esas rutas
responden 409 `REGION_PREVIEW_ONLY`. El 3D de Medusae, si lo hay, son los modelos `.glb` del equipo de
Blender, no la API. Muéstrenlo como avance, nunca como misión planificable.

## 6. Reglas que no se rompen
- El contrato (`contracts/`) solo cambia por PR revisado por el backend. Las dudas van a
  `specs/000-contrato-api/clarificacion.md`.
- `main` está protegida: cada cambio va en una rama con su PR. Los `CODEOWNERS` deciden quién aprueba.
- Nada de claves ni de la cadena de conexión de Neon en el frontend o en el repo.
- Los modelos de Blender van a `assets/` (o a R2), no a `backend/`. Los `.blend` no se suben.

## 7. Lo que falta del backend (y quién lo hace)

| # | Pendiente | Quién | Bloquea al frontend |
|---|---|---|---|
| B1 | Agregar la URL de Vercel al CORS | Backend, cuando el frontend pase la URL | Sí, en producción |
| B2 | Inercia térmica (THEMIS) → capa y suelo suelto en la ruta «más segura» | Backend | No: hoy las 3 rutas salen casi iguales y la app lo dice |
| B3 | Ortoimagen HiRISE de 25 cm como capa y textura real del 3D | Backend | No: hoy la textura es relieve sombreado |
| B4 | Mineralogía (CRISM) como capa | Backend | No |
| B5 | Fotos de Perseverance en los puntos de interés (`images[]`) | Backend o frontend (ver 8) | No: hoy `images` viene vacío |
| B6 | Miniatura de Jezero (`thumbnail_url`, hoy `null`) | Backend | No |
| B7 | Comparar la ruta calculada con la travesía real de Perseverance (CE-5 de la spec 003) | Backend | No: es un extra para la presentación |
| B8 | Mover los `.glb` de `backend/render/` a `assets/` y optimizarlos (spec 006) | Backend + Blender | No |

## 8. Lo que le toca al frontend y al equipo
Ver la tabla completa en `frontend/README.md` («Pendientes del equipo»). Lo urgente:
1. Leer `/health`, `/regions`, `/pois`, `/layers` y armar Explorar (2D).
2. Planificar: elegir base y objetivos (por defecto, la misión sugerida), llamar `/routes/compare`,
   mostrar las 3 rutas, el perfil de elevación y las advertencias.
3. Simular (3D) con el heightmap real y la polilínea de la ruta elegida.
4. Guardar la misión y mostrar el informe.
5. Publicar en Vercel y pasar la URL para el CORS (B1).

**Se puede repartir:** B5 (fotos de Perseverance) lo puede tomar el frontend: elegir 1 o 2 fotos por punto
en `https://mars.nasa.gov/mars2020/multimedia/raw-images/` (filtrar por sol), con crédito
«NASA/JPL-Caltech». Se las pasan a Dirk con el sol y el nombre del archivo, y el backend las carga.

## 9. Prompt sugerido para su agente
```
Trabajas en el frontend de TEPEXA (React + Vite + OpenLayers + React Three Fiber).
Lee primero docs/HANDOFF-FRONTEND.md, contracts/README.md, docs/constitucion.md y frontend/README.md.
Usa solo VITE_API_URL para hablar con la API, genera los tipos desde contracts/openapi.json, no
recalcules rutas en el navegador y respeta is_example, disclaimer y los textos {es, en}.
No modifiques backend/ ni contracts/: si necesitas un cambio, propónlo en
specs/000-contrato-api/clarificacion.md. Trabaja en una rama y abre un PR.
```
