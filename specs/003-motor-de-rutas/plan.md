# Spec 003 — Plan

## Diseño

```
POST /routes/compare
  → región activa (Neon) + parámetros (petición o route_defaults de la región)
  → proveedor de terreno: rejilla de elevación + máscara de suelo suelto
       hoy: terreno sintético «example-v0» (is_example: true)
       spec 002: DTM HiRISE recortado (is_example: false)
  → por perfil: grafo dirigido de 8 vecinos con costo propio → Dijkstra (SciPy)
  → tramos base → objetivo 1 → … → objetivo n (+ regreso n → base)
  → polilínea 3D, métricas, perfil de elevación, advertencias, recomendación
```

Módulos nuevos, en `backend/app/routing/`:
- `terrain.py`: clase `Terrain` (rejilla, celda, origen, NoData, suelo suelto) y conversión de punto a nodo.
- `synthetic.py`: terreno sintético. Es la única fuente: `contracts/tools/generar_ejemplos.py` lo importa.
- `walking.py`: modelo `tobler-eva-v1` y los valores por defecto con su fuente.
- `engine.py`: grafo, Dijkstra, métricas y armado de `RouteResponse`.
- `provider.py`: elige el terreno según `dataset_version`.

## Decisiones

| ID | Decisión | Motivo |
|---|---|---|
| D-20 | Dijkstra de `scipy.sparse.csgraph` sobre un grafo dirigido de 8 vecinos | Ruta óptima (A\* con heurística nula), en C; el costo depende de si se sube o se baja |
| D-21 | Rejilla de rutas de 10 m, configurable por terreno | 4 × 3 km = 120 000 nodos: cumple CE-4 (< 3 s) en Render gratis. La spec 002 la muestrea del DTM de 1 m |
| D-22 | Modelo `tobler-eva-v1`: v = 2.38 · e^(−3.5·\|tanθ + 0.05\|) km/h (2.0 km/h en llano) | Tobler con la velocidad con traje de NASA (clarificación 3). Se acepta `tobler-mars-v1` como alias del valor anterior |
| D-23 | Valores por defecto: pendiente máxima 20°, EVA 360 min | Clarificaciones 1 y 2 |
| D-24 | Costo por perfil. **Más corta:** distancia 3D. **Más rápida:** tiempo. **Más segura:** tiempo × (1 + p · suelo suelto) × (1 + (θ/θmáx)²) | La más segura evita suelo suelto y pendientes cercanas al límite |
| D-25 | Advertencias: `STEEP_SEGMENT` si la pendiente máxima ≥ 75 % del límite; `SOFT_SOIL` si hay suelo suelto; `EVA_LIMIT_EXCEEDED` si ida + vuelta superan el límite; `EXAMPLE_DATA` con terreno sintético; `CONCEPTUAL_ONLY` siempre | Principio 2: nunca afirmar que una ruta es segura |
| D-26 | Recomendación: «más segura» si cabe en el límite de EVA; si no, «más rápida» si cabe; si no, ninguna | Prioriza seguridad dentro del tiempo disponible |
| D-35 | La búsqueda corre primero en el rectángulo de base y objetivos más un margen (400 m o 25 % del tamaño); si ahí no hay ruta, en toda la región | En Render gratis el límite es la CPU: la misión de 4 objetivos baja de 0.49 a 0.17 s en local con la misma ruta. Una ruta que necesite rodear más allá del margen se encuentra igual con la búsqueda completa |
| D-27 | Los ejemplos de `contracts/` se regeneran con el motor (misma forma, valores nuevos) | El ejemplo y la API en vivo dan lo mismo para la misma petición |

## Dependencias nuevas
- `numpy==2.5.3`: rejillas y cálculo vectorial.
- `scipy==1.18.1`: Dijkstra (`scipy.sparse.csgraph`).

## Cambios de datos
- `route_defaults` de Jezero: 25° → 20°, 240 → 360 min, `tobler-mars-v1` → `tobler-eva-v1`.
- Hay que volver a correr la semilla en Neon, con visto bueno de Dirk.

## Riesgos
- **Escala de la rejilla.** Con 10 m se pierden rocas sueltas. Se avisa en `cost_model.parameters.grid_cell_m` y en el informe.
- **Valores lunares.** No son reglas de Marte; se dice en la app (clarificación 4).
