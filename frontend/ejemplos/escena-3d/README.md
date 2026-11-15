# Escena 3D de ejemplo (spec 005)

App pequeña y completa que muestra cómo se arma la parte 3D de TEPEXA con los datos reales de la API.
**No es la app final:** es el punto de partida. Copien las piezas de `src/tepexa3d/` a su app.

Tiene dos pestañas:

- **Terreno real (NASA):** el DTM HiRISE de la Margin Unit de Jezero, las 3 rutas de la misión sugerida
  (más corta, más rápida, más segura; ida continua y regreso discontinuo) y los puntos de la misión.
  Todo sale de la API: nada se calcula en el navegador.
- **Modelos del equipo:** cualquier modelo de `frontend/public/models/manifest.json`, en versión PC o celular,
  con el reemplazo si un modelo falla. Lleva la etiqueta «modelos artísticos: no son datos de NASA».

## Cómo correrla

Necesitan Node 20 o más nuevo.

```bash
cd frontend/ejemplos/escena-3d
npm install
npm run dev
```

Abran `http://localhost:5173`. Tiene que ser ese puerto: es el que la API acepta en desarrollo.
La primera carga puede tardar ~50 s si la API estaba dormida (Render gratis); la página lo avisa y reintenta.

Opciones en la dirección:
- `?vista=modelos&modelo=crater`: abre directo la galería en ese modelo.
- `?calidad=maxima|alta|baja`: calidad del terreno (por defecto `alta` en PC y `baja` en celular).

Para usar otra API (por ejemplo, la local), creen `.env.local` con `VITE_API_URL=http://127.0.0.1:8000/api/v1`.

## Piezas reutilizables (`src/tepexa3d/`)

| Archivo | Qué hace |
|---|---|
| `api.js` | Llamadas a `/regions`, `/terrain`, `/pois` y `/routes/compare`; los errores traen `message: {es, en}` |
| `coordenadas.js` | `crearTransformacion(manifiesto, exageración)`: metros locales → escena, con `scene_transform`. **La misma para todo** |
| `alturas.js` | Decodifica el heightmap PNG de **16 bits** (un `TextureLoader` lo bajaría a 8 bits y se perdería el relieve) |
| `TerrenoJezero.jsx` | Malla del terreno con la textura; `lod` y `paso` para PC o celular |
| `RutaEnTerreno.jsx` | Dibuja una polilínea de la API sobre el terreno |
| `PuntoDeInteres.jsx` | Marcador con nombre de un punto de `/pois` |
| `ModeloDelEquipo.jsx` | Carga un modelo del manifiesto (PC o celular), lo apoya en el suelo y lo escala; en celular apaga la transmisión |

Reglas que ya cumplen y que la app final debe mantener:
- Terreno, rutas y puntos usan la **misma** `transformacion`; si no, la ruta flota o se hunde.
- Cada modelo va en `<Suspense>` y en un *error boundary* con reemplazo: un modelo roto no tumba la página.
- Se muestran `disclaimer`, la recomendación con su motivo, la fuente del DTM y la etiqueta de datos de ejemplo
  cuando `is_example` es `true`.

## Calidad y rendimiento

| Calidad | Malla | Para |
|---|---|---|
| Máxima | 2001 × 1501 (6 M triángulos) | PC con tarjeta gráfica |
| Alta | 1001 × 751 (1.5 M triángulos) | PC normal (por defecto) |
| Baja | 501 × 376 (0.38 M triángulos) | Celular (por defecto) |

Descarga: terreno 0.9–2.0 MB y cada modelo del equipo 0.2–2.9 MB (versión PC) o 0.2–1.8 MB (celular).

## Fuente de los datos

Elevación: NASA/JPL-Caltech/University of Arizona; USGS Astrogeology — Fergason et al. (2020),
doi:10.5066/P9REJ9JN. Puntos: sitios de muestreo de Perseverance (NASA/JPL-Caltech). La textura del terreno es el
relieve sombreado calculado del mismo DTM (la ortoimagen real está pendiente).
