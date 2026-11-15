# Spec 003 — Motor de rutas

Estado: En curso (motor listo sobre terreno sintético; falta el DTM real de la spec 002)
Depende de: 002 (solo para el DTM real)
Cubre: `POST /routes/compare` en modo live.

## Problema
El astronauta necesita comparar rutas entre la base y los objetivos científicos sobre el
terreno real, con criterios explicados y sin afirmar que son seguras.

## Alcance
**Incluye:** búsqueda de ruta óptima (Dijkstra, D-20) sobre el DTM recortado; tres perfiles (más corta, más rápida, más segura); pendiente
máxima como filtro; tiempo con traje (Tobler ajustada a Marte, con fuente); suelo suelto por inercia
térmica; ruta de regreso y aviso de límite de EVA; métricas, perfil de elevación y advertencias.
**No incluye:** física del traje, radiación ni clima.

## Requisitos (EARS)
- **RF-003-01** El sistema DEBE devolver una ruta por perfil pedido con la forma del contrato.
- **RF-003-02** SI ninguna ruta respeta la pendiente máxima, ENTONCES DEBE responder `NO_ROUTE`.
- **RF-003-03** Un punto sobre NoData DEBE responder `NODATA`.
- **RF-003-04** Las métricas DEBEN calcularse del DTM, no de imágenes (principio 3).
- **RF-003-05** Los valores por defecto (pendiente máxima, tiempo de EVA, factor del traje) DEBEN citar su fuente.

## Criterios de aceptación
| ID | Criterio |
|---|---|
| CE-1 | En una grilla sintética con camino conocido, A\* encuentra el óptimo |
| CE-2 | La ruta más corta tiene la menor distancia; la más rápida, el menor tiempo; la más segura, el menor suelo suelto |
| CE-3 | Ningún tramo supera la pendiente máxima |
| CE-4 | Respuesta en menos de 3 s para la región piloto en Render |
| CE-5 | La ruta calculada se compara con la travesía real de Perseverance y se documenta la diferencia |
