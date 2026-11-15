# Spec 005 — Terreno 3D

Estado: Borrador
Depende de: 002
Cubre: `GET /regions/{id}/terrain` en modo live.

## Problema
El simulador 3D necesita el terreno real de la Margin Unit, liviano y alineado con la ruta.

## Requisitos (EARS)
- **RF-005-01** El manifiesto DEBE apuntar a un mapa de alturas PNG de 16 bits y a una textura de la ortoimagen, ambos en R2, con hash.
- **RF-005-02** DEBE haber al menos dos niveles de detalle: PC y móvil.
- **RF-005-03** La transformación a la escena DEBE hacer coincidir la ruta 2D con el terreno 3D.

## Criterios de aceptación
| ID | Criterio |
|---|---|
| CE-1 | Tres puntos de control coinciden entre el mapa 2D, el DTM y la escena 3D |
| CE-2 | Nivel para PC ≤ 5 MB transferidos; nivel para móvil ≤ 2 MB |
| CE-3 | Una escena de referencia en R3F carga el terreno y dibuja la ruta de ejemplo sobre él |
