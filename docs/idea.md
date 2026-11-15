# TEPEXA — Idea (Fase 0)

## Problema
Los datos de Marte (imágenes orbitales, elevación, propiedades térmicas, mineralogía,
observaciones de los rovers) están repartidos en herramientas pensadas para vistas globales
o regionales. Para planificar una caminata de astronautas hacia objetivos científicos
concretos hay que combinarlos a escala de metros, y eso hoy exige interpretar información
geoespacial a mano. **No está medido** cuánto tarda ese proceso con las herramientas
existentes: es una hipótesis que se puede probar en el evento con dos o tres personas.

## Usuarios
- **Estudiante:** explora una región, activa capas y entiende los hallazgos científicos.
- **Astronauta (simulado):** planifica una EVA entre una base y objetivos científicos, compara
  rutas y la recorre en una simulación 3D.

## Cómo se hace hoy
Mars Trek y los mapas del USGS para ver capas; los artículos de NASA/JPL para entender los
hallazgos; ninguna herramienta une ambas cosas con un cálculo de ruta a escala de caminata.

## Cómo sabremos que funcionó (demo)
1. El flujo completo Explorar → Planificar → Simular → Resultados funciona en la versión
   publicada sin errores críticos.
2. Las tres rutas de un escenario fijo se calculan sobre el DEM real y sus métricas son
   coherentes con el perfil de elevación.
3. Cada capa y cada hecho mostrado tiene su fuente.

## Qué queda fuera
Cuentas de usuario, mundo abierto, física del traje, radiación u oxígeno calculados, clima
predictivo, navegación fuera de la región, regiones más allá de Jezero y Medusae Fossae.

## Criterios del jurado de Space Apps
Impacto, creatividad, validez, relevancia y presentación. La demo debe tocar los cinco.
