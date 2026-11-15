# Spec 004 — Clarificaciones

| # | Duda | Respuesta | Fuente | Fecha | Certeza |
|---|---|---|---|---|---|
| 1 | ¿Se guarda la ruta como geometría PostGIS? | No: se guarda el objeto `Route` del contrato en `jsonb`. La misión se lee entera, no se consulta por geometría | Decisión (D-32) | 15-nov | Decisión |
| 2 | ¿Se guarda una ruta o las tres? | Solo la del perfil elegido (`selected_profile`), recalculada en el servidor | RF-004-01 | 15-nov | Confirmado |
| 3 | ¿Cómo se evita llenar la base gratuita? | 10 misiones por IP cada 10 min (429 `RATE_LIMITED`), máximo 2000 misiones (se borran las más viejas), y una ruta de menos de 1 MB por misión | CE-3 (D-33) | 15-nov | Decisión |
| 4 | ¿Cómo sabe el informe qué objetivo es cada punto? | Busca el punto de interés más cercano a cada objetivo, a 30 m o menos. Si no hay ninguno, pone «Objetivo n (x, y)» | Decisión | 15-nov | Decisión |
| 5 | ¿El informe se guarda? | No: se arma al pedirlo con la misión guardada, la región y sus fuentes, así siempre sale coherente con la ruta | CE-2 | 15-nov | Decisión |
| 7 | ¿Qué pasa con las misiones si se vuelve a correr la semilla de una región? | Se borran: `missions.region_id` usa `on delete cascade` y las semillas borran y reinsertan la región. Antes de volver a sembrar Jezero en Neon, avisar al equipo | Migración 002 | 15-nov | Confirmado |
| 6 | ¿Descargar el informe? | El backend entrega los datos; si se imprime o descarga lo decide el frontend | Conflicto registrado en `docs/estado-y-decisiones.md` | 15-nov | Pendiente (frontend) |
