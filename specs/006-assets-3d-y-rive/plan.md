# Spec 006 — Plan

## Principio: el equipo cambia sus modelos sin romper producción
- Los **originales** (Blender, Tripo, etc.) van a `assets/models/originales/` en la PC de quien los
  trabaje. Esa carpeta está en `.gitignore`: pueden pesar 60 MB y GitHub no acepta archivos de más de 100 MB.
- `cd pipeline/assets && npm install && npm run modelos` genera, por cada modelo,
  `frontend/public/models/<nombre>/pc.glb` y `movil.glb`, y actualiza `frontend/public/models/manifest.json`
  (peso, triángulos y avisos). **Solo eso se sube a Git.**
- Nunca borra ni cambia los originales. Si un modelo se pasa del presupuesto, **avisa pero no falla**:
  el equipo decide si lo simplifica en Blender o lo usa igual.
- El frontend lee el manifiesto: elige `pc` o `movil`, carga cada modelo dentro de `Suspense` y un
  *error boundary* con un reemplazo simple (cápsula o caja). Si un modelo no está o falla, la app sigue.
- El backend **no depende** de estos modelos: rutas y terreno del simulador salen del DTM real.

## Presupuesto (avisos)
| Perfil | Por modelo | Cómo |
|---|---|---|
| PC | ≤ 4 MB | meshopt + WebP 2048 px; la geometría solo se simplifica si pasa de 1 millón de triángulos (objetivo: 300 mil) |
| Móvil | ≤ 1.5 MB | meshopt + WebP 1024 px, objetivo 75 mil triángulos (máximo 25 %). Si aún pesa: 512 px y la mitad; se queda el más liviano |

## Medición (15-nov)
| Modelo | Original | PC | Móvil |
|---|---|---|---|
| `mars` | 5.25 MB | 0.96 MB (129 072 tri) | 0.26 MB (32 268 tri) |
| `crater` | 4.31 MB | 0.50 MB (178 804 tri) | 0.18 MB (44 701 tri) — usa transmisión (agua): apagarla en móvil |
| `medusa` | 18.79 MB | 1.82 MB (624 962 tri) | 0.63 MB (156 240 tri) |
| `alejandro` (Tripo) | 59.75 MB | 2.75 MB (299 974 tri) | 1.29 MB (130 902 tri) |
| `dirk` (Tripo) | 60.96 MB | 2.84 MB (299 968 tri) | 1.42 MB (143 088 tri) |
| `dylan` (Tripo) | 60.78 MB | 2.77 MB (300 051 tri) | 1.26 MB (125 743 tri) |
| `israel` (Tripo) | 59.85 MB | 2.72 MB (300 090 tri) | 1.15 MB (113 304 tri) |
| `yasid` (Tripo) | 59.87 MB | 2.78 MB (299 899 tri) | 1.30 MB (130 442 tri) |
| `china` (Tripo) | 60.52 MB | 2.91 MB (299 924 tri) | 1.49 MB (150 284 tri) |
| `drone` (Tripo) | 62.29 MB | 2.87 MB (299 982 tri) | 1.77 MB (~190 mil tri) — ⚠ supera 1.5 MB |

Los escaneos de Tripo tienen muchas costuras de UV: el simplificador no baja de ~10 % de los triángulos aunque se le
permita más error. Para el dron, lo que sí funciona es exportarlo de Tripo con menos caras; si no, se acepta el aviso.

## Decisiones
| ID | Decisión | Motivo |
|---|---|---|
| D-36 | glTF-Transform 4.5.1 (CLI) con meshopt y WebP | Gratis, lo carga three.js/drei sin configurar nada; 8× menos peso sin tocar la geometría en PC |
| D-37 | Originales fuera de Git; optimizados en `frontend/public/models/` | Vercel los sirve; Render no se vuelve a publicar por un modelo; GitHub no acepta > 100 MB |
| D-38 | Presupuesto como aviso, no como error | Flexibilidad del equipo: deciden ellos |
| D-39 | Reemplazo simple si un modelo falla | Un modelo roto no puede tumbar la demo |

## Notas
- `Crater.glb` es artístico: no coincide con el DTM. Sirve para la entrada; el simulador usa el heightmap
  de la API. Para tener su estilo sobre el terreno real: importar el heightmap PNG 16 bits en Blender sobre
  un plano de 4000 × 3000 m (origen en la esquina suroeste) y exportar.
- Modelos de personas reales (p. ej. los avatares de Tripo con nombres de integrantes): consentimiento de
  cada persona antes de publicarlos (principio 12).

## Dependencias
- `@gltf-transform/cli@4.5.1` (solo en `pipeline/assets`, no en la API ni en el frontend).
