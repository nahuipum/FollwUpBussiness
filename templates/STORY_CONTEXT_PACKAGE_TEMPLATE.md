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

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo | Este paquete | Handoff `READY_FOR_HANDOFF` | Implementación y pruebas dirigidas |
| QA | Paquete + handoff Dev + candidato | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba |
| Seguridad | Paquete + QA + candidato | `PASS`/`NOT_APPLICABLE`/otro estado | Riesgo según diff |
| DoF | Paquete + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Misma versión candidata |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de
hash invalida este paquete y requiere una nueva versión del Orquestador.
