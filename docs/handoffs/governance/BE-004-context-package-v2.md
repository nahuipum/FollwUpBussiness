# Paquete de Contexto de Historia — BE-004 — v2

**Sustituye para fases nuevas:** [BE-004-context-package.md](BE-004-context-package.md) v1. Conserva v1 y el handoff `BLOCKED` como evidencia: la decisión aprobada en ADR-021 resuelve exclusivamente `SEC-BE004-09` y `SEC-BE004-10`.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-004-renovar-sesion.md` — SHA-256 `FCE3CEE262C5C8C1C4E6E1F1BBC8F2C01A8CCBD5A0212F60152D49180A66BD74` |
| Commit o diff candidato | Base `a7e444a684d032be4da9ee4aac48528a33bd5fd7`; candidato de remediación: ADR-021, paquetes/handoffs BE-004 y cambios Backend posteriores, sin commit/PR autorizado. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE004-AC01 | Refresh válido produce un access y un único refresh sucesor por canal. | BE-004, Criterio 1; ADR-008, «Refresh token, familia y rotación» | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC02 | Familia revocada/expirada/inválida nunca se renueva ni revela contexto. | BE-004, Criterio 2; ADR-008, tabla de resultados | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC03 | La rotación conserva el límite absoluto de 30 días. | BE-004, Criterio 3; ADR-008, «Refresh token, familia y rotación» | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC04 | Todo resultado crítico queda auditado transaccionalmente y trazado por correlationId, sin secreto/PII completa. | BE-004, Criterio 4; ADR-008, «Auditoría»; ADR-021, Decisión | `FCE3CEE2…A66BD74`; `26542BF2…40DEC`; `4BE44B17…1825D2` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| v1 estable | RF-AUT-004, ADR-008, ADR-020, OpenAPI `/auth/refresh` e invariantes Backend descritos en v1. | Paquete v1, tablas «Criterios», «Reglas» y «Contratos». | Se reutilizan sin releer la fuente primaria. |
| ADR21-AUTH-AUDIT | `audit` ofrece puerto público tipado para contexto técnico derivado de familia persistida. | ADR-021, Decisión | `identityaccess` usa solo el puerto, sin tabla/adaptador interno de `audit`. |
| ADR21-TX | Rotación/revocación/auditoría crítica comparten `DataSource` y transacción PostgreSQL; credenciales solo tras commit. | ADR-021, Decisión | Prueba de rollback y de ausencia de `200` inconsistente. |
| ADR21-MIN | Comando auditado excluye secretos, cabeceras, IP, payload y PII; tenant nullable solo plataforma. | ADR-021, Decisión | Vocabulario cerrado, validación y pruebas negativas. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| ADR | `docs/architecture/adr/ADR-021-auditoria-autenticacion-anonima-transaccional.md` | Decisión aprobada para desbloquear auditoría de refresh. | BE-004, audit, Seguridad |
| Contrato intra-backend | Módulo `audit`, puerto público de autenticación anónima | Contexto técnico permitido y semántica transaccional. | `identityaccess` |
| Backend | Módulos `identityaccess` y `audit`, más Flyway/config/pruebas estrictamente necesarias | Refresh, rotación, límite, auditoría y transacción sin cambio de OpenAPI. | WEB/MOBILE, INT-002/003 |
| REST estable | `docs/api/openapi.yaml`, `/auth/refresh` | Sin cambios de contrato. | FE-003, MOB-002 |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Contrato público tipado de auditoría para refresh | En alcance de remediación | ADR-021 |
| Misma transacción PostgreSQL para familia/token/auditoría | En alcance de remediación | ADR-021; SEC-BE004-10 |
| Rotación, replay, tenant, limitador y errores | En alcance original; controles v1 reutilizados | Paquete v1; ADR-008 |
| Cambiar OpenAPI, logout o auditoría genérica para otros flujos | Fuera de alcance | ADR-021, Consecuencias |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY reutilizado | Matriz SEC-BE004-01..10 vigente; ADR-021 resuelve el bloqueo de 09/10 y exige su verificación final. | `docs/handoffs/security/BE-004-preflight.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE004-01..08 | Sin cambio. | Según paquete v1 y preflight. | Según paquete v1 y preflight. | Sí |
| SEC-BE004-09 | Falta de evidencia/fuga en observabilidad. | Puerto audit público, allowlist, entrada append-only y telemetría saneada. | Resultados críticos auditados; sin secretos/PII en auditoría, logs o métricas. | Sí |
| SEC-BE004-10 | Carrera/auditoría no atómica. | Mismo `DataSource`/transacción para rotación, revocación y auditoría; respuesta tras commit. | Fallo de auditoría/rotación revierte todo; carrera no deja segundo sucesor. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo de remediación | Este paquete v2 + v1 `BLOCKED` + preflight | Handoff `READY_FOR_HANDOFF`/`BLOCKED` | ADR-021 y los diez controles cubiertos |
| QA afectado | Paquete v2 + handoff Dev + candidato | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Criterios y `SEC-*`, especialmente 09/10 |
| Seguridad final | Paquete v2 + Dev + QA + candidato | `PASS`/otro estado | Los diez controles sobre el mismo candidato |
| DoF | Paquete v2 + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Commit, PR y CI del mismo candidato |

## Regla de excepción

La única relectura desde v1 fue ADR-020 D2, porque el bloqueo demostró que faltaba la semántica de privilegios de escritura y transacción; su hash permanece `445D2D6DA624DA79BF1060379092F42C8226FB1E8F92C6E9DF1E82541E1D9D62`. Cualquier cambio de hash/fuente/candidato exige una versión nueva.

## Ruta de remediación

Aplicar solo `Desarrollo de remediación → QA afectado → Seguridad final → DoF`. Reutilizar el preflight v1 y la evidencia de que no hubo implementación previa; no reiniciar la historia.
