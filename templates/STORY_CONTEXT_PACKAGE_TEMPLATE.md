# Paquete de Contexto de Historia — HU-XXX

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | |
| Commit o diff candidato | |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Control de revisiones

Este archivo es el paquete canónico de la HU. No crear archivos `-vN`.

| Revisión | Fecha | Motivo y delta | Candidato/manifiesto | Evidencia invalidada o reutilizable | Estado |
|---|---|---|---|---|---|
| r1 | | Paquete inicial | | | VIGENTE |

## Registro de gates

| Fase | Documentos de entrada verificados (ruta) | Candidato coincidente | Estado de entrada | Decisión del Orquestador |
|---|---|---|---|---|
| Preflight Seguridad | | Sí \| No | | AUTORIZADA \| BLOQUEADA |
| Desarrollo | | Sí \| No | | AUTORIZADA \| BLOQUEADA |
| QA | | Sí \| No | | AUTORIZADA \| BLOQUEADA |
| Seguridad final | | Sí \| No | | AUTORIZADA \| BLOQUEADA |
| DoF | | Sí \| No | | AUTORIZADA \| BLOQUEADA |

No se puede marcar `AUTORIZADA` mediante una respuesta conversacional: las
rutas deben existir y el documento debe declarar HU, fase, estado, versión del
paquete y candidato coincidentes. Una fila incompleta deja la fase `BLOQUEADA`.
Un bloqueo previo a una fase se registra en esta tabla, junto con el documento
faltante y la acción requerida; no crea otro documento de gobernanza.

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY \| NOT_APPLICABLE | Antes de Desarrollo | |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-HU-XXX-01 | | | | Sí \| No |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Preflight Seguridad | Este paquete, sin código | `ADVISORY`/`NOT_APPLICABLE` + matriz `SEC-*` | Controles verificables |
| Desarrollo | Este paquete | Handoff `READY_FOR_HANDOFF` | Implementación y pruebas dirigidas |
| QA | Paquete + handoff Dev + candidato | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba |
| Seguridad | Paquete + handoffs Dev/QA + candidato | Informe FINAL `PASS`/`NOT_APPLICABLE`/`CHANGES_REQUIRED`/`BLOCKED` | Riesgo según diff |
| DoF | Paquete + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Misma versión candidata |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de
hash invalida la revisión vigente y requiere una nueva revisión append-only del
Orquestador en este mismo archivo.

## Ruta de remediación

Un hallazgo de Seguridad no reinicia la HU. Agregar una revisión con el delta
del candidato y controles afectados, y recorrer `Dev de remediación →
QA afectado → Seguridad final → DoF`. Reutilizar evidencia inmutable de
controles no afectados y documentar la decisión.
