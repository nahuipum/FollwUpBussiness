# Flujo operativo entre agentes

## 0. Política de eficiencia

- Trabajar una historia y una fase por solicitud.
- No iniciar todos los agentes por defecto. Invocar solo el agente de la
  aplicación afectada y avanzar al siguiente gate mediante su handoff.
- Entregar a cada revisor: historia, diff o commit objetivo, handoff anterior y
  rutas de evidencia. No reenviar el historial completo de conversación.
- Leer documentos grandes por ID o sección. Evitar recorridos generales del
  repositorio cuando el alcance ya está identificado.
- Ejecutar primero pruebas dirigidas al cambio. Ampliar a regresión completa
  cuando el riesgo sea transversal, fallen pruebas dirigidas o el gate lo exija.
- Reutilizar resultados verificables de CI. No volver a ejecutar una suite
  costosa si el código objetivo no cambió y la evidencia identifica commit,
  comando y resultado.
- Mantener handoffs breves: no pegar logs completos, código ni documentos.
  Registrar comando, resultado, ruta de evidencia, hallazgos y pendientes.
- Detener la fase al encontrar un bloqueo concluyente; no consumir contexto en
  revisiones secundarias que no puedan cambiar el estado.
- El Orquestador crea `docs/handoffs/governance/<HU>-context-package.md` una
  sola vez por HU. Incluye criterios normalizados, reglas, contratos y ADR
  aplicables, todos con ruta, sección y hash. Si cambia historia/candidato,
  agrega una revisión append-only con el delta y la identidad nueva; no crea
  otro archivo solo para incrementar una versión.
- Cada fase recibe solo el identificador del paquete, el commit/diff fijado,
  el handoff anterior y las rutas de evidencia. Al lanzar subagentes usar
  contexto limpio (`fork_turns: "none"`); no propagar el historial completo.
- Antes de lanzar cada fase, el Orquestador valida en disco el paquete y todos
  los documentos de entrada: existen, no están vacíos y declaran la misma HU,
  versión del paquete y candidato. Una respuesta de chat no es evidencia ni
  autorización. Si una entrada falta o no coincide, persiste/solicita un
  `BLOCKED` que identifique el faltante y detiene el flujo.
- La ruta normal es estricta: Dev `READY_FOR_HANDOFF` documentado → QA `PASS`
  documentado → Seguridad final `PASS`/`NOT_APPLICABLE` documentado → DoF. QA
  `CHANGES_REQUIRED` o `BLOCKED` vuelve a Desarrollo y no permite Seguridad ni
  DoF. Seguridad `CHANGES_REQUIRED` o `BLOCKED` permite solamente la
  remediación acotada. Nunca interpretar la falta de hallazgos, trabajo o
  entorno como un `PASS` implícito.
- QA mantiene independencia ejecutando sus pruebas y contrastando los criterios
  del paquete; no vuelve a descubrir documentación. Seguridad y DoF verifican
  evidencia y solo reabren una fuente primaria mediante una excepción trazada.
- Si una fuente o el candidato cambia, invalidar la revisión vigente y agregar
  una revisión nueva en el paquete canónico antes del siguiente gate. No
  reutilizar evidencia entre candidatos sin revalidarla explícitamente.
- Mantener un archivo canónico por fase. Un bloqueo previo a una fase se anota
  en el Registro de gates del paquete; una remediación o revalidación se agrega
  al handoff de su fase. No crear archivos `-vN`, de reanudación o de gate solo
  para repetir la misma identidad y estado.
- Para superficies de riesgo, ejecutar un preflight de Seguridad tras crear el
  paquete y antes de Desarrollo. El resultado es `ADVISORY`, no una aprobación:
  entrega una matriz breve de controles `SEC-<HU>-NN`, amenaza y pruebas
  obligatorias. No inspecciona código ni reabre fuentes ya incluidas.
- Desarrollo no puede emitir `READY_FOR_HANDOFF` sin una evidencia de
  implementación y prueba por cada control aplicable. QA no puede emitir
  `PASS` sin la matriz `SEC-*` trazada a sus pruebas.
- Tras `CHANGES_REQUIRED` o `BLOCKED` de Seguridad, ejecutar solo
  `Remediación Dev → QA afectado → Seguridad final → DoF`. Conservar las fases
  aprobadas y sus evidencias del mismo candidato si el cambio no las afecta.
  No reiniciar Desarrollo ni QA completos.

## 1. Entrada mínima de una historia

Una historia debe contener:

- Identificador.
- Actor.
- Necesidad.
- Valor.
- Reglas aplicables.
- Criterios de aceptación.
- Fuera de alcance.
- Datos.
- Dependencias.
- Riesgos conocidos.
- Diseños o contrato, si aplican.

---

## 2. Fase de análisis

### Desarrollo

Cada agente identifica:

- Componentes afectados.
- Contratos necesarios.
- Cambios de datos.
- Riesgos técnicos.
- Estrategia de pruebas.
- Dependencias entre plataformas.

### QA

QA transforma criterios de aceptación en:

- Casos felices.
- Casos negativos.
- Límites.
- Concurrencia.
- Permisos.
- Recuperación.
- Regresión.

### Seguridad

Determina si requiere:

- Threat model.
- Revisión de autenticación.
- Revisión de datos personales.
- Revisión de geolocalización.
- Revisión de archivo.
- Revisión de dependencia.
- Prueba de abuso.

Antes de Desarrollo, cuando el riesgo aplica, Seguridad emite un preflight
`ADVISORY` que transforma estas necesidades en controles concretos y pruebas
observables. La revisión final conserva independencia y valida el diff, el
resultado de QA y los controles implementados.

---

## 3. Orden de contratos

Para funcionalidades compartidas:

1. Se define el comportamiento funcional.
2. Backend propone OpenAPI, eventos y modelo de sincronización.
3. Frontend y Mobile revisan consumibilidad.
4. QA crea pruebas de contrato.
5. Se aprueba el contrato.
6. Las plataformas implementan en paralelo.

El contrato no debe modificarse silenciosamente para acomodar una implementación.

---

## 4. Handoff de Desarrollo a QA

Debe incluir:

- Historia y criterios cubiertos.
- Archivos o módulos modificados.
- Endpoint/evento/pantalla.
- Migraciones.
- Flags.
- Datos de prueba.
- Casos cubiertos.
- Casos no cubiertos.
- Riesgos.
- Evidencia CI.
- Instrucciones para reproducir.
- Impacto de seguridad.

El handoff debe identificar el diff o commit revisable y limitarse a información
nueva de la historia. Las reglas permanentes permanecen en sus fuentes de verdad.
Debe además referenciar la versión del Paquete de Contexto y declarar cualquier
lectura excepcional de una fuente primaria.
Para cada control `SEC-*` aplicable debe declarar implementación, prueba y
evidencia; una fila faltante bloquea el avance a QA. Antes de QA, el
Orquestador verifica además que el archivo exista, no esté vacío y tenga la
misma HU, paquete/version y candidato.

---

## 5. Handoff de QA

QA entrega:

- Matriz criterio → prueba.
- Ambiente y versión.
- Resultados.
- Evidencia.
- Defectos.
- Regresión ejecutada.
- Riesgos residuales.
- Estado `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.

Un resultado `CHANGES_REQUIRED` o `BLOCKED` no habilita Seguridad ni DoF. Debe
existir una remediación de Desarrollo y un nuevo handoff QA sobre el candidato
que la incorpora antes de retomar la ruta normal.

---

## 6. Handoff de seguridad

Seguridad entrega:

- Superficie revisada.
- Hallazgos.
- Severidad.
- Evidencia.
- Escenario de abuso.
- Recomendación.
- Estado de remediación.
- Riesgo aceptado, solo con responsable.

Seguridad es obligatoria si el cambio afecta autenticación, autorización,
aislamiento multiempresa, datos personales, geolocalización, almacenamiento
local, archivos, dependencias, secretos, APIs públicas, WebSocket, Redis,
RabbitMQ, infraestructura o CI/CD. En ausencia de estas superficies puede emitir
`NOT_APPLICABLE` con una justificación breve basada en el diff.

El preflight usa la misma plantilla, se marca `ADVISORY` y solo contiene
matriz de controles, amenazas y pruebas requeridas. La revisión final no puede
aprobar un control que no esté trazado por Desarrollo y QA.

---

## 6.1 Remediación de Seguridad

Cuando Seguridad emite `CHANGES_REQUIRED` o `BLOCKED`, el Orquestador fija un
nuevo candidato y crea un handoff de remediación con los IDs `SEC-*` fallidos.

1. Desarrollo modifica exclusivamente los controles fallidos y sus pruebas.
2. QA ejecuta los casos que cubren los controles, componentes y regresión
   afectados; reutiliza evidencia inmutable de controles no afectados.
3. Seguridad revisa solo los hallazgos y superficies modificadas, y declara si
   los controles previos siguen vigentes.
4. DoF revalida la trazabilidad del nuevo candidato.

Solo se reinicia la HU completa si cambian sus requisitos, contrato, diseño o
una evidencia anterior deja de ser válida.

---

## 7. Validación DoF

DoF no vuelve a desarrollar ni sustituye a QA.

Antes de emitir `PASS`, DoF debe ejecutar o verificar directamente el cierre de
entrega del mismo candidato: commit revisable, pull request trazable y CI
asociado. Si el usuario autoriza la entrega, el propio proceso DoF crea el
commit y PR, espera y revisa el resultado de CI; no delega este gate al usuario.
Sin evidencia de los tres elementos sobre el mismo commit, el resultado es
`BLOCKED`.

Valida:

- Trazabilidad.
- Cumplimiento funcional.
- Integración.
- Pruebas.
- Seguridad.
- Documentación.
- Operabilidad.
- Despliegue.
- Evidencias.

Si falta evidencia, el resultado es `BLOCKED`, aunque el código parezca correcto.

DoF parte de la matriz de trazabilidad del Paquete de Contexto, los handoffs y
la evidencia inmutable de CI. No relee la HU ni documentación ya trazada salvo
una excepción registrada. La independencia se conserva al verificar el mismo
commit, PR y CI directamente, no al duplicar la ingestión de documentos.
