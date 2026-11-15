# Spec 002 — Tareas (borrador)

## Bloque A — Elegir y verificar los datos
- [ ] T1 · Confirmar cobertura del mosaico HiRISE de Mars 2020 sobre la Margin Unit · Hecho cuando: hay un recorte con DTM y ortoimagen que cubre los objetivos
- [ ] T2 · Elegir los productos de THEMIS, CRISM y CTX · Hecho cuando: el catálogo de datos tiene identificadores exactos
- [ ] T3 · Descargar los productos en la PC de Dirk · ⚠ intervención manual (Dirk da permiso)

## Bloque B — Pruebas que fallan
- [ ] T4 · Pruebas del manifiesto, de los puntos de control y de la transformación al marco local · CE-1, CE-2

## Bloque C — Procesamiento
- [ ] T5 · Recorte, alineación y reproyección al marco local (GDAL/Rasterio)
- [ ] T6 · Teselas del mapa base, relieve, inercia térmica y mineralogía
- [ ] T7 · Mapa de alturas PNG de 16 bits y versión liviana para móvil
- [ ] T8 · Manifiesto con hashes

## Bloque D — Publicación
- [ ] T9 · Crear buckets en R2 y subir archivos · ⚠ intervención manual (Dirk, cuenta de Cloudflare)
- [ ] T10 · Migración 002 si hace falta y semilla real de `sources`, `layers` y `pois` en Neon · ⚠ visto bueno de Dirk
- [ ] T11 · `/layers` en modo live · CE-3
- [ ] T12 · Actualizar `docs/datos/catalogo-de-datos.md` y créditos · Cierre
