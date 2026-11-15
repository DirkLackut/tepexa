# Spec 000 — Contrato de la API

Estado: En curso
Depende de: —
Cubre: el acuerdo de datos entre backend y frontend para todas las pantallas de la demo.

## 1. Problema
El backend (Dirk) y el frontend (resto del equipo) trabajan en paralelo. Sin un
acuerdo escrito sobre qué datos intercambian, el frontend tiene que esperar al backend o
adivinar la forma de las respuestas, y la integración falla al final.

## 2. Alcance

**Incluye**
- La forma exacta de cada respuesta y petición de la API para: estado del servicio, regiones,
  capas, puntos de interés, terreno 3D, comparación de rutas, misiones e informe.
- Los errores y advertencias, con códigos estables y mensajes en dos idiomas.
- Un archivo de ejemplo por cada respuesta, marcado como ejemplo.
- Una API que, en modo ejemplo, ya responde con esos archivos.

**No incluye**
- Datos reales (spec 002), base de datos (spec 001), cálculo de rutas (spec 003).
- Diseño de pantallas: es del frontend.

## 3. Quién usa qué

| Pantalla | Usuario | Datos que necesita |
|---|---|---|
| Explorar | Estudiante | Regiones, capas, puntos de interés |
| Planificar | Astronauta | Región (parámetros por defecto), comparación de rutas |
| Simular EVA | Astronauta | Terreno 3D, la ruta elegida, puntos de interés |
| Resultados | Ambos | Informe de misión |
| Próxima misión (Medusae) | Ambos | Región en modo avance con hechos y su certeza |

## 4. Requisitos (EARS)

- **RF-000-01** El sistema DEBE ofrecer la lista de regiones con su estado (`active` o
  `preview`), nombre, resumen y centro aproximado en coordenadas marcianas.
- **RF-000-02** CUANDO se pida una región, el sistema DEBE devolver su marco de coordenadas,
  límites en metros, rango de elevación, objetivo de misión, hechos con fuente y certeza, y
  parámetros de ruta por defecto.
- **RF-000-03** CUANDO se pidan las capas de una región activa, el sistema DEBE devolver para
  cada capa su tipo, títulos y descripción en dos idiomas, fuente, resolución, leyenda, origen
  de las teselas, visibilidad y opacidad por defecto, limitaciones y si se usa en el cálculo
  de rutas.
- **RF-000-04** CUANDO se pidan los puntos de interés, el sistema DEBE devolverlos como
  GeoJSON en el marco local, con categoría, episodio científico cuando aplique, evidencia e
  imágenes con crédito.
- **RF-000-05** CUANDO se pida el terreno de una región activa, el sistema DEBE devolver un
  manifiesto con mapa de alturas, textura, niveles de detalle, rango de elevación y la
  transformación del marco local a la escena 3D.
- **RF-000-06** CUANDO se pida comparar rutas, el sistema DEBE devolver una ruta por perfil
  pedido, con polilínea 3D, métricas, tramos, perfil de elevación, advertencias, ruta de
  regreso si se pidió, y las versiones del dataset y del algoritmo.
- **RF-000-07** CUANDO se guarde una misión, el sistema DEBE devolver su identificador; CUANDO
  se pida su informe, DEBE devolver resumen, métricas, fuentes, supuestos, limitaciones y
  aviso de uso conceptual.
- **RF-000-08** SI la petición es inválida o no se puede atender, ENTONCES el sistema DEBE
  responder con un código de error estable y un mensaje en español e inglés.
- **RF-000-09** SI la región está en modo `preview`, ENTONCES el sistema DEBE rechazar capas,
  terreno y rutas con el error `REGION_PREVIEW_ONLY`.
- **RF-000-10** Toda respuesta construida con datos de ejemplo DEBE llevar `is_example: true`.
- **RF-000-11** Todo texto pensado para el usuario DEBE venir en español e inglés.

## 5. Reglas
- **RN-000-01** Coordenadas en metros en el marco local de la región: `x` hacia el este, `y`
  hacia el norte, origen en la esquina suroeste del recorte. `z` es elevación en metros
  respecto al datum del DEM.
- **RN-000-02** Las rutas y métricas del simulador, el mapa y el informe son las mismas que
  entrega la API (constitución, principio 4).
- **RN-000-03** El contrato solo cambia por PR revisado por el otro lado (principio 5).

## 6. Criterios de aceptación

| ID | Criterio | Cómo se comprueba |
|---|---|---|
| CE-1 | Cada archivo de `contracts/examples/` es válido contra su modelo | `test_examples_validate` |
| CE-2 | `contracts/openapi.json` coincide con lo que generan los modelos | `test_openapi_up_to_date` |
| CE-3 | Cada endpoint en modo ejemplo responde 200 con un cuerpo válido | `test_endpoints_example_mode` |
| CE-4 | Región inexistente → 404 `REGION_NOT_FOUND`; Medusae en capas/terreno/rutas → 409 `REGION_PREVIEW_ONLY` | `test_errors` |
| CE-5 | Las métricas de la ruta de ejemplo son coherentes con su polilínea (distancia, ascenso, descenso, pendiente máxima) | `test_route_example_consistency` |
| CE-6 | Todos los textos para el usuario tienen `es` y `en` no vacíos | `test_localized_text_complete` |
| CE-7 | El equipo de frontend puede leer `contracts/README.md` y saber qué endpoint usa cada pantalla | Revisión del frontend |

## 7. Lista de comprobación manual
1. Abrir `http://localhost:8000/docs` con el servidor en modo ejemplo y ejecutar cada endpoint.
2. Confirmar que `GET /api/v1/regions/medusae-fossae/terrain` responde 409 con mensaje en los
   dos idiomas.
3. Pasar `contracts/README.md` al equipo de frontend y anotar sus dudas en `clarificacion.md`.

## 8. Fuera de alcance explícito
Autenticación, cuentas, paginación (hay pocas regiones), caché HTTP (spec de despliegue),
avatares (son assets del frontend; la misión solo guarda sus identificadores).
