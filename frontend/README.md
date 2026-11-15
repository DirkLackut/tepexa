# Frontend — guía y pendientes del equipo

App en React + Vite + OpenLayers + React Three Fiber. La construye el equipo de frontend.
**Empiecen por `docs/HANDOFF-FRONTEND.md`** (estado de la API publicada, datos reales y qué falta).
Después lean `contracts/README.md` (qué endpoint usa cada pantalla) y
`docs/constitucion.md`.

## Flujo de la app (acordado)
1. **Entrada:** video de animación automático con el globo (Blender).
2. **Explorar (2D):** capas científicas y puntos de interés de Jezero, con fuentes. Público: estudiante.
3. **Planificar (2D + panel):** base y objetivos, pendiente máxima, tiempo de EVA, 3 rutas
   (más corta, más rápida, más segura) con perfil de elevación y comparación. Público: astronauta.
4. **Simular EVA (3D):** terreno real, astronauta caminando la ruta elegida, cámara en tercera
   persona y en primera persona con HUD, fichas al llegar a cada objetivo, minimapa 2D.
5. **Resultados:** informe en pantalla con métricas, fuentes, supuestos y limitaciones.
6. **Próxima misión:** Medusae Fossae como avance (ficha y hechos con certeza, sin rutas).

PC = consola de planificación con paneles. Móvil = modo campo con controles grandes; el 3D
también va en móvil, en versión liviana (`lods[].recommended_for = "mobile"`).

## Reglas técnicas (para no romper la integración)
1. **Tipos generados, no escritos a mano:**
   `npx openapi-typescript ../contracts/openapi.json -o src/shared/api/types.ts`
   Vuelvan a generarlos cada vez que cambie `contracts/openapi.json`.
2. **Una sola URL base configurable:** `VITE_API_URL=https://tepexa-api.onrender.com/api/v1`. Sin
   conexión, lean los archivos de `contracts/examples/` (terreno sintético). Cuando esté en Render, `GET /api/v1/health` → `endpoints`
   dice qué partes ya son datos reales (`live`) y cuáles siguen de ejemplo.
   Render gratis tarda unos 50 s en despertar si nadie lo usó en 15 min: muestren un estado de carga.
3. **Lector tolerante:** ignoren campos que no conozcan y muestren `message` aunque llegue un
   código de advertencia nuevo.
4. **`is_example: true`** → mostrar una etiqueta visible «Datos de ejemplo / Example data».
5. **Una sola polilínea:** mapa, minimapa, simulador 3D e informe usan la misma ruta que entrega
   la API. Nadie recalcula rutas en el navegador.
6. **Bilingüe:** todo texto de la API viene `{es, en}`; los textos propios de la interfaz también
   deben existir en los dos idiomas.
7. **3D con carga diferida:** nada de three.js ni modelos en la carga inicial; se cargan al entrar
   al simulador.
8. **Nunca** usar claves ni la cadena de conexión de la base de datos en el frontend.
9. El contrato solo cambia por Pull Request revisado por el backend; las dudas van a
   `specs/000-contrato-api/clarificacion.md`.

## Pendientes del equipo (lo que el backend necesita o no puede hacer)

| # | Pendiente | Responsable | Para qué |
|---|---|---|---|
| 1 | Decidir el idioma por defecto (Dirk dijo español, el equipo inglés) | Frontend | La API entrega los dos |
| 2 | Decidir si el informe solo se ve en pantalla o también se descarga | Frontend | El backend entrega los datos igual |
| 3 | Pasar los colores HEX del logo a `docs/identidad-visual.md` y subir el logo a `assets/` | Diseño | Paleta oficial |
| 4 | Exportar los modelos de Blender a `.glb` con las reglas de abajo y entregarlos a Dirk | Blender | Pipeline de assets |
| 5 | Entregar los avatares `.riv` (exportados para la web, no el archivo del editor) | Diseño | Selección de tripulación y HUD |
| 6 | Producir el video de entrada (MP4 o WebM, menos de 10 MB) | Blender | Pantalla de entrada |
| 7 | Publicar en Vercel con un nombre de proyecto que empiece con `tepexa` (la API ya acepta `https://tepexa….vercel.app`) | Frontend | Que la página publicada pueda leer la API |
| 8 | Decidir el dominio (subdominio gratis de Vercel o uno propio) | Diseño | Dirección pública de la app |
| 9 | Medir FPS en laptop, iPhone y Android con el simulador | Frontend | Ajustar calidad del 3D |
| 10 | Preparar la laptop con Blender MCP para la prueba de modelos | Blender | Verificar modelos y optimización |
| 11 | Preparar el envío a Space Apps: textos en inglés, video de hasta 30 s o 7 diapositivas, declaración de uso de IA, marca de agua en imágenes generadas con IA, sin logos de NASA | Todo el equipo | Requisitos de la entrega |

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
