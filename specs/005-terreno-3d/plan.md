# Spec 005 — Plan

## Diseño
```
GET /regions/{id}/terrain  →  manifiesto (spec 000) con URL absolutas a /assets/terrain/<region>/<versión>/
  heightmap-lod0.png  2001 × 1501, 16 bits, 2 m/px  (PC)
  heightmap-lod1.png  1001 × 751,  16 bits, 4 m/px  (móvil)
  texture-relief.webp relieve sombreado del DTM (la ortoimagen real queda para T6)
  scene_transform     fórmula única para terreno, rutas y puntos
```

## Decisiones
| ID | Decisión | Motivo |
|---|---|---|
| D-40 | Los archivos del terreno los sirve la API (`StaticFiles` en `/assets`), no R2 | Son ~3 MB: no justifican otra cuenta ni otra llave. Si crecen (ortoimagen de 25 cm), se pasan a R2 sin cambiar el contrato, porque el manifiesto ya trae URL absolutas |
| D-41 | La escena de referencia vive en `frontend/ejemplos/escena-3d/`, aparte de la app | El equipo de frontend arma su app como quiera; copia las piezas de `src/tepexa3d/` |
| D-42 | El heightmap se decodifica con `upng-js` en el navegador | Un `TextureLoader` lo baja a 8 bits y se pierde el relieve (448 m en 256 niveles = 1.75 m por escalón) |

## Dependencias nuevas (solo en el ejemplo, `frontend/ejemplos/escena-3d/package.json`)
- `react` 18.3.1, `react-dom` 18.3.1, `three` 0.170.0, `@react-three/fiber` 8.17.10, `@react-three/drei` 9.117.3
- `upng-js` 2.1.0: decodificar PNG de 16 bits (D-42)
- `vite` 5.4.11 y `@vitejs/plugin-react` 4.3.4 (desarrollo)

## Verificación
- Puntos de control (CE-1): la base y los 4 objetivos se dibujan con su `elevation_m` y quedan sobre el terreno;
  la polilínea de la API (z del mismo DTM) va pegada al suelo en todo el recorrido.
- Capturas en PC (1440 × 880) y celular (390 × 844) con la API local y datos reales `hirise-v1`.
