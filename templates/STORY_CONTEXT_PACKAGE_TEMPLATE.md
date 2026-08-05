# Paquete de Contexto de Historia — HU-XXX — v1

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | |
| Commit o diff candidato | |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

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
| Seguridad | Paquete + QA + candidato | `PASS`/`NOT_APPLICABLE`/otro estado | Riesgo según diff |
| DoF | Paquete + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Misma versión candidata |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de
hash invalida este paquete y requiere una nueva versión del Orquestador.

## Ruta de remediación

Un hallazgo de Seguridad no reinicia la HU. Crear una nueva versión del paquete
solo para el candidato y controles afectados, y recorrer `Dev de remediación →
QA afectado → Seguridad final → DoF`. Reutilizar evidencia inmutable de
controles no afectados y documentar la decisión.
