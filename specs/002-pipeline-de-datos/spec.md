# Spec 002 — Pipeline de datos reales

Estado: En curso (parte 1 lista: DTM real, puntos de interés reales, rutas y terreno 3D en vivo)
Depende de: 001
Cubre: `/regions/{id}/layers` en modo live y los datos que usan las specs 003 y 005.

## Problema
El catálogo usa ubicaciones y capas de ejemplo. Para la demo, el mapa, las rutas y el 3D
deben salir de productos reales de NASA, recortados a la Margin Unit y en el marco local.

## Alcance
**Incluye:** elegir y verificar los productos (`docs/datos/catalogo-de-datos.md`), descargarlos,
recortarlos a la misma zona, reproyectarlos al marco local en metros, generar teselas y mapas de
alturas, subirlos a Cloudflare R2, cargar `sources` y `layers` en Neon, y fijar los puntos de
interés con la travesía real de Perseverance.
**No incluye:** el cálculo de rutas (003) ni el manifiesto 3D (005).

## Requisitos (EARS)
- **RF-002-01** El pipeline DEBE producir, para la región, un DTM recortado, una ortoimagen alineada, la capa de inercia térmica y la de mineralogía, todos en el marco local.
- **RF-002-02** Cada archivo publicado DEBE quedar en un manifiesto con versión, hash SHA-256, tamaño, extensión y transformación.
- **RF-002-03** CUANDO la API corre en modo live, `/layers` DEBE leer de la base con `is_example: false`.
- **RF-002-04** Los puntos de interés DEBEN ubicarse con fuentes verificables (travesía o artículos), con nota de certeza.
- **RF-002-05** SI un producto no cubre la zona, ENTONCES el pipeline DEBE fallar con un mensaje claro, sin rellenar datos.

## Criterios de aceptación
| ID | Criterio |
|---|---|
| CE-1 | Tres puntos de control coinciden entre DTM y ortoimagen dentro de la tolerancia documentada |
| CE-2 | El manifiesto valida contra su esquema y sus hashes coinciden con los archivos en R2 |
| CE-3 | `/layers` live devuelve 5 capas reales con fuente y producto exacto |
| CE-4 | Ningún punto de interés queda fuera de la región ni sobre NoData |
