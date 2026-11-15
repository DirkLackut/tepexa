# Spec 006 — Tareas

- [x] T1 · Medir los 3 GLB del repo (mars, crater, medusa) · 28.4 MB → 3.3 MB en PC (plan.md)
- [x] T2 · Optimizador `pipeline/assets/optimizar.mjs` con manifiesto y avisos · CE-1
- [x] T2b · Probar con los modelos de Tripo (drone y 5 avatares de ~60 MB) · 6 modelos, 363 MB → 16.7 MB en PC (plan.md); el dron en móvil queda en 1.77 MB (aviso)
- [x] T2c · Identificar `tripo_convert_0bf3dddf-….glb` · es `china` (de Israel): 60.5 MB → 2.91 MB PC / 1.49 MB móvil
- [ ] T2d · Dron en móvil (1.77 MB > 1.5 MB): reexportar desde Tripo con menos caras · ⚠ equipo (docs/HANDOFF-FRONTEND.md, 5b)
- [x] T3 · Capturas comparativas original vs. optimizado · CE-3. 15-nov: de cuerpo entero no se nota; de cerca, la reducción de triángulos mancha la cara de los avatares de Tripo (no las texturas ni la compresión). Solución: generar con Smart Mesh o Retopology de Tripo (D-43). Las capturas no van al repo (personas reales)
- [ ] T4 · Acordar con el equipo mover `backend/render/*.glb` a `assets/models/originales/` (sin borrar nada hasta que digan) · ⚠ equipo
- [x] T5 · Consentimiento de las personas en los avatares de Tripo · confirmado por Dirk (15-nov): alejandro, dirk, dylan, israel, yasid
- [ ] T6 · Prueba con Blender MCP en la laptop del equipo · ⚠ equipo
- [x] T7 · Revisión automática en cada PR (`pipeline/checks/revisar-archivos.mjs` + GitHub Actions): bloquea archivos > 10 MB, `.blend`, originales y modelos fuera de lugar o sin manifiesto; avisa sobre el presupuesto · CE-1
- [x] T7b · Marcar `revisar-archivos` como obligatoria en la regla de `main` · agregada por Dirk (15-nov)
- [x] T8 · Nuevas versiones del equipo con Smart Mesh: `china` (60.5 → 1.6 MB PC / 0.8 MB móvil), `crater` (Jezero con su lago antiguo, 0.6 / 0.3 MB) y `medusa` (0.4 / 0.2 MB). Los HD anteriores quedan en `assets/models/originales/anteriores/` (fuera de Git)
- [x] T9 · El optimizador ya no reduce triángulos en modelos de menos de 75 mil (la versión móvil solo baja la textura a 1024 px)
