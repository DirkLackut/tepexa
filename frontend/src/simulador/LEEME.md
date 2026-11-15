# Simulación 3D (módulo aislado: puede llegar a cambiar)

Este módulo es la versión actual de la simulación 3D. **Es posible** que cambie (no está decidido); por eso está aislado
y, si se cambia, se puede reemplazar por completo:
la página `src/pages/EVASimulator.tsx` solo lo carga (con carga diferida) y le pasa los datos.

Contrato del módulo (lo único que debe respetar un reemplazo):
- Recibe por props `terreno` (GET /regions/{id}/terrain), `rutas` (POST /routes/compare), `perfil`,
  `paradas` (base + objetivos en orden, GeoJSON de /pois), `tripulante` (id del manifiesto de modelos)
  y `limiteEva` (minutos).
- Usa la **misma polilínea** de la API: no recalcula rutas.
- La telemetría sale solo de la ruta (tiempo, distancia, elevación, pendiente, EVA restante). Nada inventado.

Archivos: `recorrido.js` (tiempos por vértice y punto a una distancia), `Caminante.jsx` (avatar que camina, rumbo y
cámaras amortiguadas), `Dron.jsx` (acompañante con aleteo), `HUD.jsx` (visor, minimapa y retrato), `index.jsx` (escena).

Mapas:
- **Jezero · Margin Unit:** DTM HiRISE real y rutas de `POST /routes/compare`.
- **Medusae Fossae (`medusae/`):** terreno **ILUSTRATIVO** (no es un DTM de NASA) con yardangs generados en el navegador
  y las 3 rutas calculadas con el mismo modelo de caminata que la API (`tobler-eva-v1`, límite de pendiente, arena).
  Todo va marcado `is_example: true`. Cuando la API tenga un DTM real de Medusae, se reemplaza por ese.

Movimiento: el avatar no tiene esqueleto; `shared/3d/AvatarArticulado.jsx` dobla piernas, brazos y torso en el
sombreador de vértices según la distancia caminada (mismo costo que dibujarlo quieto). Escala del tripulante: ×15.
