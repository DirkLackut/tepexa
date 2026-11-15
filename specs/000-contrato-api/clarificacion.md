# Spec 000 — Clarificaciones

| # | Duda | Respuesta | Fuente | Fecha | Certeza |
|---|---|---|---|---|---|
| 1 | ¿Idioma por defecto? | La API entrega siempre `{es, en}`; el frontend elige el idioma por defecto | Dirk (es) y equipo (en) difieren; se resuelve sin bloquear | 14-nov | Confirmado |
| 2 | ¿Medusae Fossae calcula rutas? | No. Es «avance completo» de próxima misión: ficha, hechos y terreno del equipo | Equipo, 14-nov | 14-nov | Confirmado |
| 3 | ¿El backend genera el PDF del informe? | No. Entrega los datos; el frontend lo muestra | Equipo: «solo en pantalla» | 14-nov | Confirmado |
| 4 | ¿Avatares en la API? | No. Son `.riv` del frontend; la misión guarda solo identificadores | Lógica: no hay datos de avatar en el backend | 14-nov | Confirmado |
| 5 | ¿Formato del mapa de alturas para el 3D? | PNG de 16 bits: `z = z_min + (valor / 65535) · (z_max − z_min)` | Lógica: lo lee el navegador sin librerías extra | 14-nov | Supuesto (se confirma en spec 005) |
| 6 | ¿Formato de las teselas del mapa? | El contrato admite `xyz`, `pmtiles`, `cog` o `image`; el valor real se fija en spec 002 | Lógica | 14-nov | Supuesto |
| 7 | Pendiente máxima y tiempo máximo de EVA por defecto | 25° y 240 min, **provisionales**; se investigan con fuente en spec 003 | Dirk aprobó investigarlos | 14-nov | Supuesto |
| 8 | Centro de Medusae Fossae en el globo | Aproximado, marcado con `approximate: true` | Se fija con datos en spec 002 | 14-nov | Supuesto |

## Supuestos que habría que confirmar
- Si el frontend prefiere teselas en otro formato, cambia solo `TileSource.format` (spec 002).
- Si la textura 3D necesita KTX2 en vez de WebP, cambia solo `TerrainTexture.format` (spec 005).
