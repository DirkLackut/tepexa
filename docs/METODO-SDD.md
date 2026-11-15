# Plantilla de trabajo con Spec-Driven Development (SDD)

Plantilla reutilizable para arrancar **cualquier** proyecto desde cero con el mismo método
que ya usamos. Base: `github.com/mouredev/hello-sdd`. Lo demás son las reglas que fuimos
fijando con el uso, puestas aquí para no volver a improvisarlas ni saltarse pasos.

Cómo se usa: copia este archivo al nuevo repositorio como `docs/METODO-SDD.md`, sustituye
todo lo que esté entre `<>` y borra lo que no aplique. Luego sigue la Fase 0 **en orden**.

---

## 0. Las cinco reglas que no se negocian

1. **Nada se escribe antes de la constitución.** Si no hay principios, no hay con qué
   decidir, y las decisiones terminan tomándose por costumbre.
2. **Una spec a la vez, cerrada antes de abrir la siguiente.** Las specs abiertas a medias
   son la fuente número uno de trabajo perdido.
3. **Ambigüedad resuelta y escrita.** Toda duda de requisito va a `clarificacion.md` con la
   respuesta y de dónde salió. Nunca se queda solo en la conversación.
4. **Pruebas primero.** Primero el caso de prueba que falla, después el código.
5. **Ejecución por bloques.** Se para al terminar un bloque, cuando una tarea necesita
   intervención manual, cuando algo cambia la spec o el plan, o cuando algo falla sin
   arreglo evidente.

---

## 1. Fase 0 — Antes de la primera spec

Este es el tramo que se salta y luego cuesta. Hazlo completo, en este orden.

### 1.1 La idea, en una página

Crea `docs/idea.md` y responde solo esto, sin diseñar nada todavía:

| Pregunta | Qué se espera |
|---|---|
| ¿Qué problema real resuelve? | Un defecto medible del proceso actual, no una mejora genérica |
| ¿Quién lo va a usar? | Roles concretos, con nombre del cargo |
| ¿Cómo se hace hoy sin el sistema? | El proceso manual, tal como es |
| ¿Cómo sabremos que funcionó? | 2 o 3 números verificables |
| ¿Qué queda fuera? | Lista explícita de exclusiones |
| ¿Hay un intento anterior que falló? | Por qué falló |

Sin la última columna llena, no sigas. Si no hay un defecto medible, el proyecto no tiene
criterio de éxito y cualquier entrega parecerá suficiente.

### 1.2 Fuentes de verdad

Antes de modelar nada, consigue el material real: archivos, formatos impresos, planillas,
capturas del sistema que se usa hoy. Las reglas de negocio se extraen **de los datos**, no
de lo que alguien recuerda. Anota en `docs/hallazgos-datos.md`: volumen verificado, defectos
medidos y reglas deducidas, cada una con su evidencia.

### 1.3 Restricciones duras

Decláralas antes de elegir el stack, porque mandan sobre él. Las típicas:

- **Costo.** ¿Hay presupuesto o es costo cero sin excepciones? Si es cero, ningún plan pago
  ni en desarrollo ni en producción, y el stack se elige bajo esa condición.
- **Privacidad.** ¿Hay datos de personas reales, menores de edad o información sensible?
  Si los hay: nunca se versionan, nunca se copian a pruebas, nunca se pegan en una
  conversación. Los datos de prueba se generan aparte y con un prefijo reconocible.
- **Secretos.** Claves solo en `.env.local` (o el equivalente), llenado a mano, fuera del
  control de versiones y fuera del chat.
- **Portabilidad.** ¿Puede quedar amarrado a un proveedor? Si no, nada exclusivo de ese
  proveedor en el código.
- **Legal.** Licencias, normativa de protección de datos, uso comercial del hosting.

### 1.4 Constitución

`.specify/memory/constitution.md` (o `docs/constitucion.md`). Principios **numerados**, cada
uno redactado como una regla verificable, no como un deseo. Se citan después por su número
(«principio 7»), así que la numeración no se reordena nunca: si uno queda obsoleto, se marca
como derogado y se agrega otro al final.

Esqueleto sugerido:

```markdown
# Constitución de <PROYECTO>

Versión 1.0 — <fecha>

## Principios

1. **<Nombre corto>.** <Regla verificable: qué se hace y qué no>.
2. ...

## Cómo se cambia

Un principio se modifica solo con una decisión registrada en `docs/estado-y-decisiones.md`,
con fecha y motivo. Cambiar un principio obliga a revisar las specs abiertas.
```

Temas que conviene que tengan principio propio: calidad verificable (pruebas primero),
seguridad y permisos, privacidad de datos, costo, portabilidad, accesibilidad, idioma del
producto y del código, trazabilidad entre requisito y código.

### 1.5 Repositorio y entorno

1. Repositorio creado, con decisión explícita de **público o privado** (si es público, repasa
   1.3 antes del primer commit).
2. `.gitignore` antes del primer commit: secretos, dependencias, artefactos de compilación,
   archivos de datos reales.
3. `README.md` con una línea de qué es, cómo se instala y cómo se corre.
4. `docs/estado-y-decisiones.md` creado vacío con sus secciones (ver 3.6).
5. Rama `main` protegida en lo posible: todo entra por Pull Request.
6. **Dónde corre cada cosa**, escrito. Qué se hace en la conversación, qué en la máquina
   local y qué en producción. Sin esto se intenta ejecutar en el lugar equivocado y se
   rompen cosas.

### 1.6 Orden de las specs

Antes de escribir la primera, lista las specs previstas y el orden, con una línea de por qué.
Regla práctica: **primero la que sostiene a las demás** (base de datos, autenticación,
registro), luego las de valor visible, y al final lo que solo se puede hacer cuando el resto
está en producción (migración de datos reales, página de presentación, endurecimiento).

Ejemplo de tabla inicial (en `docs/estado-y-decisiones.md`):

| Spec | Nombre | Depende de | Estado |
|---|---|---|---|
| 001 | <base y registro> | — | Siguiente |
| 002 | <núcleo del negocio> | 001 | Pendiente |
| 003 | <consulta y reportes> | 002 | Pendiente |

---

## 2. El ciclo de una spec

Siempre el mismo, sin atajos:

```
idea / backlog
   └─ 1. spec.md ............ QUÉ y para quién. Sin tecnología.
        └─ 2. clarificacion.md ... Toda duda, con su respuesta.
             └─ 3. plan.md ....... CÓMO. Decisiones técnicas numeradas.
                  └─ 4. tasks.md . Tareas ordenadas, en bloques.
                       └─ 5. Implementación: prueba que falla → código → prueba pasa
                            └─ 6. Cierre: checklist, evidencias, PR, estado actualizado
```

Carpeta por spec: `specs/001-nombre-corto/`.

Reglas del ciclo:

- No se pasa de un artefacto al siguiente con preguntas abiertas: se contestan en
  `clarificacion.md` primero.
- Si durante la implementación cambia algo de la spec o del plan, **se para**, se corrige el
  documento y se retoma. El documento nunca queda atrás del código.
- Cada decisión técnica recibe un identificador `D1`, `D2`… correlativo **en todo el
  proyecto**, no por spec, y se cita desde el código y desde los documentos.
- Cada criterio de aceptación recibe `CE-1`, `CE-2`… y debe ser comprobable por alguien que
  no escribió el código.

---

## 3. Plantillas copiables

### 3.1 `specs/NNN-nombre/spec.md`

```markdown
# Spec NNN — <Nombre>

Estado: Borrador | Aprobada | En curso | Cerrada (<fecha>)
Depende de: <specs previas>
Elementos del backlog que cubre: <PB-nn, RF-nn>

## 1. Problema

<Qué duele hoy, con el número que lo demuestra.>

## 2. Alcance

**Incluye**
- <...>

**No incluye**
- <...>

## 3. Usuarios y permisos

| Rol | Qué puede hacer en esta spec | Qué no |
|---|---|---|

## 4. Comportamiento esperado

Por cada función, en lenguaje del negocio:

### 4.1 <Nombre de la función>
- **Entrada:** <...>
- **Reglas:** <...>
- **Salida:** <...>
- **Qué pasa si falla:** <mensaje y estado resultante>

## 5. Reglas de negocio que aplica

| ID | Regla | Origen |
|---|---|---|
| RN-01 | <...> | <dato, documento o respuesta del cliente> |

## 6. Criterios de aceptación

| ID | Criterio | Cómo se comprueba |
|---|---|---|
| CE-1 | <Observable, sin ambigüedad> | <prueba automática o paso manual> |

## 7. Lista de comprobación manual

Renglones numerados que una persona recorre en el sistema ya desplegado, con el resultado
esperado de cada uno. Se marca al cerrar la spec y se guarda la evidencia.

## 8. Fuera de alcance explícito

<Lo que alguien podría asumir que entra y no entra.>
```

### 3.2 `specs/NNN-nombre/clarificacion.md`

```markdown
# Spec NNN — Clarificaciones

Toda duda de requisito, con su respuesta. Si no se pudo preguntar, se resuelve por lógica y
se marca como supuesto, con el riesgo que implica.

| # | Duda | Respuesta | Fuente | Fecha | Certeza |
|---|---|---|---|---|---|
| 1 | <...> | <...> | Cliente / dato / lógica | <fecha> | Confirmado / Supuesto |

## Supuestos que habría que confirmar

- <...> → si resulta falso, afecta a <...>
```

### 3.3 `specs/NNN-nombre/plan.md`

```markdown
# Spec NNN — Plan técnico

## Decisiones

| ID | Decisión | Motivo | Alternativa descartada |
|---|---|---|---|
| D<n> | <...> | <...> | <...> |

## Modelo de datos

<Tablas o entidades nuevas y modificadas, llaves, restricciones, índices. Qué migración
las crea.>

## Dónde vive cada regla

| Regla | Dónde se hace cumplir | Por qué ahí |
|---|---|---|

Principio: una regla de negocio se hace cumplir en el punto más profundo posible (la base de
datos), para que siga valiendo aunque alguien no use la interfaz.

## Estrategia de pruebas

- Unitarias de dominio: <...>
- De base de datos: <...>
- De integración / extremo a extremo: <...>
- Qué NO se prueba automáticamente y por qué: <...>

## Riesgos

| Riesgo | Señal de que ocurrió | Qué haríamos |
|---|---|---|
```

### 3.4 `specs/NNN-nombre/tasks.md`

```markdown
# Spec NNN — Tareas

Se ejecutan en orden. Se para al terminar cada bloque.

## Bloque A — <nombre>
- [ ] T1 · <tarea> · Entregable: <archivo o resultado> · Comprueba: <CE-n>
- [ ] T2 · ...

## Bloque B — <nombre>
- [ ] T3 · ...

## Bloque de cierre
- [ ] T<n> · Lista de comprobación manual recorrida y marcada
- [ ] T<n> · Evidencias guardadas con su índice
- [ ] T<n> · Documentación de usuario actualizada
- [ ] T<n> · `docs/estado-y-decisiones.md` actualizado
- [ ] T<n> · PR aprobado y desplegado
```

Cada tarea cumple tres condiciones o se parte en varias: tiene un entregable verificable,
cabe en una sesión y declara qué criterio comprueba.

Marca con un símbolo las tareas que **requieren intervención manual** (migraciones contra la
base real, credenciales, aprobación de un PR, cualquier cosa destructiva). Al llegar a una,
el bloque se detiene.

### 3.5 Cierre de spec

Una spec se declara cerrada solo cuando:

- [ ] Todos los `CE-n` comprobados, cada uno con su evidencia
- [ ] Lista de comprobación manual recorrida en el entorno real, con hallazgos corregidos
      **y vueltos a comprobar**
- [ ] Suite de pruebas completa en verde
- [ ] Compilación y verificación de tipos sin errores
- [ ] Revisión de seguridad del alcance nuevo
- [ ] Documentos de la spec al día con lo que quedó en el código
- [ ] `docs/estado-y-decisiones.md` con el estado, el commit y los hallazgos
- [ ] Desplegado

### 3.6 `docs/estado-y-decisiones.md`

El documento que se lee primero al retomar el proyecto. Secciones:

```markdown
# <PROYECTO> — Estado y decisiones

Actualizado: <fecha>

## Qué es
## Estado de las specs            <- tabla con estado, commit y qué falta
## Restricciones duras            <- costo, privacidad, secretos, legal
## Stack                          <- con el ID de decisión que lo justifica
## Decisiones de arquitectura      <- las que atraviesan varias specs
## Dónde corre cada cosa          <- conversación / máquina local / producción
## Orden de cada despliegue       <- la secuencia exacta de comandos
## Evidencias                     <- dónde están y cómo se nombran
## Lecciones                      <- errores cometidos y la regla que dejaron
```

---

## 4. Ejecución por bloques

Cuándo se detiene el trabajo, sin excepción:

1. Al terminar un bloque de tareas.
2. Cuando la siguiente tarea necesita intervención manual o una credencial.
3. Cuando algo contradice la spec o el plan: primero se corrige el documento.
4. Cuando algo falla y el arreglo no es evidente: se reporta el error tal como salió, no una
   interpretación.
5. Cuando aparece una decisión que no se puede deshacer.

Al parar se informa: qué quedó hecho, qué sigue y qué se necesita para continuar.

---

## 5. Convenciones de numeración

| Prefijo | Para qué | Alcance |
|---|---|---|
| `HU-n` | Historia de usuario | Proyecto |
| `RF-n` / `RNF-n` | Requerimiento funcional / no funcional | Proyecto |
| `PB-n` | Elemento del backlog | Proyecto |
| `RN-n` | Regla de negocio | Proyecto |
| `D-n` | Decisión técnica | Proyecto, correlativo |
| `CE-n` | Criterio de aceptación | Por spec |
| `T-n` | Tarea | Por spec |

Nunca se reutiliza un número liberado. Un identificador obsoleto se marca como derogado.

---

## 6. Git y despliegue

- Nada se commitea directo a `main`: rama por spec o por arreglo, y Pull Request.
- Una rama por spec (`spec/003-nombre`), y ramas de arreglo aparte (`fix/003-t23`).
- Los archivos se agregan **por lista explícita**, nunca con un comodín que arrastre lo que
  no debía versionarse.
- Mensaje de commit: qué cambió y por qué, citando la spec y la tarea.
- El orden de cada despliegue se escribe una vez en `estado-y-decisiones.md` y se sigue
  igual siempre. Plantilla: rama → push → migraciones → tipos generados → verificación →
  aprobar PR → comprobar en producción.
- Después de cada fusión, la copia local se queda atrás: se sincroniza antes de abrir la
  siguiente rama.

---

## 7. Checklist anti-error (las trampas reales)

Antes del primer commit:

- [ ] `.gitignore` cubre secretos, datos reales y artefactos de compilación
- [ ] Ningún archivo con datos de personas reales está en el repositorio
- [ ] Decidido si el repositorio es público; si lo es, revisado lo anterior dos veces

Antes de cada implementación:

- [ ] La spec está aprobada y sin preguntas abiertas
- [ ] El plan tiene las decisiones numeradas
- [ ] Las pruebas se escriben antes del código

Antes de tocar la base de datos real:

- [ ] Hay autorización explícita y en el momento
- [ ] La operación se probó antes contra una copia local con datos sintéticos
- [ ] Es reversible, o hay respaldo y se dijo que no es reversible

Antes de cerrar:

- [ ] La lista manual se recorrió en el entorno real, no en el local
- [ ] Los hallazgos se corrigieron **y se volvieron a comprobar**
- [ ] Los documentos dicen lo que el código hace

Lecciones que ya pagamos y conviene heredar:

| Error | Regla que dejó |
|---|---|
| Datos reales a un paso de un repositorio público | Los datos sensibles nunca entran al repositorio ni a las pruebas; los de prueba llevan prefijo reconocible |
| Documentos que quedaron atrás del código | Al cambiar el comportamiento, el documento se corrige en el mismo bloque |
| Decisiones sin identificador, imposibles de rastrear | Toda decisión técnica tiene `D-n` y se cita desde el código |
| Dudas resueltas solo en la conversación y luego olvidadas | Todo va a `clarificacion.md`, incluidos los supuestos |
| Confiar en que lo que pasa local pasa en producción | La lista de comprobación manual se recorre en producción |
| Una dependencia con vulnerabilidades sin alternativa | El stack se revisa al elegirlo: mantenimiento, licencia y vulnerabilidades |
| Un cliente que no recordaba su propia regla | Las reglas se extraen de los datos; lo que diga la memoria se marca como supuesto |

---

## 8. Documentación mínima del proyecto

Que exista desde temprano, no al final:

- `README.md` — qué es, instalación, cómo se corre, cómo se prueba
- `docs/idea.md` — la página de la Fase 0
- `docs/constitucion.md` — principios numerados
- `docs/estado-y-decisiones.md` — estado y decisiones vivas
- `docs/hallazgos-datos.md` — evidencia del proceso actual
- `docs/seguridad/plan.md` y `resultados.md` — revisión por spec
- `docs/manual-<rol>.md` — un manual por rol, en el lenguaje del usuario
- `specs/NNN-nombre/` — `spec.md`, `clarificacion.md`, `plan.md`, `tasks.md`

---

## 9. Arranque en diez pasos

1. `docs/idea.md` contestado, con el defecto medible.
2. Material real conseguido y leído; `docs/hallazgos-datos.md` escrito.
3. Restricciones duras declaradas.
4. Constitución con principios numerados.
5. Repositorio, `.gitignore`, `README.md`, `estado-y-decisiones.md`.
6. Orden de las specs decidido y escrito.
7. Stack elegido **bajo** las restricciones, cada pieza con su `D-n`.
8. Spec 001 escrita, aclarada, planificada y dividida en tareas.
9. Primer bloque ejecutado con pruebas primero; parada e informe.
10. Spec 001 cerrada con su checklist antes de abrir la 002.
```
