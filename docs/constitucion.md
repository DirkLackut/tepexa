# Constitución de TEPEXA

Versión 1.0 — 14 de noviembre de 2026. Los principios no se renumeran: si uno queda
obsoleto se marca como derogado y se agrega otro al final. Todo cambio se registra en
`docs/estado-y-decisiones.md` con fecha, motivo e impacto.

1. **Evidencia científica.** Toda capa, punto de interés y hecho mostrado indica su fuente
   (misión, instrumento, producto, URL) y su grado de certeza. Un dato sintético o de ejemplo
   nunca se presenta como dato de NASA.
2. **Honestidad operativa.** La app hace planificación conceptual y educativa. Nunca dice
   «ruta segura», «apta para astronautas» ni «validado por NASA».
3. **Dato separado del render.** Rutas y métricas salen del DEM procesado. Las imágenes,
   renders y modelos de Blender son presentación, nunca fuente de cálculo.
4. **Una sola fuente de la ruta.** Mapa 2D, simulador 3D, minimapa e informe consumen el mismo
   resultado de la API. Nadie recalcula una ruta en otro lugar.
5. **Contrato primero.** Backend y frontend se comunican solo por `contracts/`. Un cambio al
   contrato es un PR revisado por el otro lado.
6. **Pruebas antes del código.** Cada spec define primero el caso que falla.
7. **Una spec por ciclo.** Una spec se aprueba, aclara, implementa y cierra antes de abrir la
   siguiente. Investigar y preparar assets en paralelo sí está permitido.
8. **Ambigüedades a la vista.** Toda duda resuelta o supuesto va a `clarificacion.md` con su
   fuente y certeza.
9. **Cartografía marciana explícita.** Marco local en metros por región, con transformación
   documentada. Nunca EPSG:4326, EPSG:3857 ni `geography` para medir en Marte.
10. **Bilingüe.** Todo texto para el usuario existe en español e inglés.
11. **Optimización verificable.** El 3D se carga solo al entrar al simulador; los assets se
    sirven comprimidos y versionados; el rendimiento se mide en los equipos reales.
12. **Sin secretos ni datos personales en el repo.** Claves en `.env.local`. Avatares parecidos
    a personas solo con consentimiento.
13. **Costo cero.** Solo planes gratuitos o créditos de los patrocinadores del evento.
14. **Accesibilidad.** Contraste legible, controles por teclado y rutas distinguibles sin
    depender solo del color.
