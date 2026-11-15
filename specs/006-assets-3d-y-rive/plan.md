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
| `mars` (Marte, Smart Mesh; reemplaza al de `backend/render`) | 1.62 MB | 0.39 MB (18 916 tri) | 0.24 MB (18 916 tri) |
| `crater` (Jezero con su lago antiguo, Smart Mesh; reemplaza al de `backend/render`) | 2.25 MB | 0.60 MB (19 672 tri) | 0.32 MB (19 672 tri) |
| `medusa` (Medusae Fossae, Smart Mesh; reemplaza al de `backend/render`) | 1.54 MB | 0.38 MB (17 193 tri) | 0.23 MB (17 193 tri) |
| `alejandro` (Tripo) | 59.75 MB | 2.75 MB (299 974 tri) | 1.29 MB (130 902 tri) |
| `dirk` (Tripo) | 60.96 MB | 2.84 MB (299 968 tri) | 1.42 MB (143 088 tri) |
| `dylan` (Tripo) | 60.78 MB | 2.77 MB (300 051 tri) | 1.26 MB (125 743 tri) |
| `israel` (Tripo) | 59.85 MB | 2.72 MB (300 090 tri) | 1.15 MB (113 304 tri) |
| `yasid` (Tripo) | 59.87 MB | 2.78 MB (299 899 tri) | 1.30 MB (130 442 tri) |
| `china` (Tripo Smart Mesh; el HD de 60.5 MB quedó en `originales/anteriores/`) | 9.38 MB | 1.64 MB (19 127 tri) | 0.81 MB (19 127 tri) |
| `drone` (Tripo) | 62.29 MB | 2.87 MB (299 982 tri) | 1.77 MB (~190 mil tri) — ⚠ supera 1.5 MB |

Los escaneos de Tripo tienen muchas costuras de UV: el simplificador no baja de ~10 % de los triángulos aunque se le
permita más error. Para el dron, lo que sí funciona es exportarlo de Tripo con menos caras; si no, se acepta el aviso.

**Calidad (15-nov, capturas con la misma cámara y luz):** de cuerpo entero, PC y móvil no se distinguen del original.
De cerca, la cara de los avatares HD se mancha. La causa es la **reducción de triángulos** (se probó: comprimir con
meshopt y pasar a WebP sin reducir queda igual al original, pero pesa 11 MB). Pasa igual con 50 % que con 15 %. Los modelos
generados con **Smart Mesh** o pasados por **Retopology** en Tripo (~20 mil triángulos, textura horneada) quedan limpios en
PC y en móvil, y pesan menos de la mitad.

## Decisiones
| ID | Decisión | Motivo |
|---|---|---|
| D-36 | glTF-Transform 4.5.1 (CLI) con meshopt y WebP | Gratis, lo carga three.js/drei sin configurar nada; 8× menos peso sin tocar la geometría en PC |
| D-37 | Originales fuera de Git; optimizados en `frontend/public/models/` | Vercel los sirve; Render no se vuelve a publicar por un modelo; GitHub no acepta > 100 MB |
| D-38 | Presupuesto como aviso, no como error | Flexibilidad del equipo: deciden ellos |
| D-39 | Reemplazo simple si un modelo falla | Un modelo roto no puede tumbar la demo |
| D-43 | Modelos nuevos de Tripo: generar con **Smart Mesh** (o Retopology si ya existe en HD), exportar GLB con textura 2k; el optimizador no reduce triángulos por debajo de 75 mil | Calidad de la cara sin manchas y un solo gasto de créditos por modelo (Retopology cuesta 35 créditos extra) |

## Notas
- `Crater.glb` es artístico: no coincide con el DTM. Sirve para la entrada; el simulador usa el heightmap
  de la API. Para tener su estilo sobre el terreno real: importar el heightmap PNG 16 bits en Blender sobre
  un plano de 4000 × 3000 m (origen en la esquina suroeste) y exportar.
- Modelos de personas reales (p. ej. los avatares de Tripo con nombres de integrantes): consentimiento de
  cada persona antes de publicarlos (principio 12).

## Dependencias
- `@gltf-transform/cli@4.5.1` (solo en `pipeline/assets`, no en la API ni en el frontend).
