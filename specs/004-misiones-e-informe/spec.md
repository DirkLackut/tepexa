# Spec 004 — Misiones e informe

Estado: Borrador
Depende de: 003
Cubre: `POST /missions`, `GET /missions/{id}`, `GET /missions/{id}/report` en modo live.

## Problema
Al terminar la simulación, el usuario necesita un informe con la ruta elegida, sus métricas,
las fuentes, los supuestos y las limitaciones, que se pueda volver a abrir.

## Requisitos (EARS)
- **RF-004-01** CUANDO se guarde una misión, el sistema DEBE recalcular la ruta en el servidor (no confiar en la que manda el navegador) y guardar parámetros, versiones del dataset y del algoritmo.
- **RF-004-02** El informe DEBE listar fuentes, supuestos, limitaciones y el aviso de uso conceptual.
- **RF-004-03** Las misiones NO DEBEN guardar datos personales; la tripulación son solo identificadores de avatar.

## Criterios de aceptación
| ID | Criterio |
|---|---|
| CE-1 | Una misión guardada devuelve la misma ruta y métricas al leerla |
| CE-2 | El informe coincide con la ruta guardada |
| CE-3 | Límites de tamaño y de cantidad de peticiones evitan abuso de la base gratuita |
