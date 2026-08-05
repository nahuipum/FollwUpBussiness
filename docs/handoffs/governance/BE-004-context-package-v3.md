# Paquete de Contexto de Historia — BE-004 — v3

**Sustituye para QA, Seguridad final y DoF:** `BE-004-context-package-v2.md`. V2 conserva el desbloqueo por ADR-021; v3 fija el candidato de Desarrollo listo para revisión.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-004-renovar-sesion.md` — SHA-256 `FCE3CEE262C5C8C1C4E6E1F1BBC8F2C01A8CCBD5A0212F60152D49180A66BD74` |
| Commit o diff candidato | Base `a7e444a684d032be4da9ee4aac48528a33bd5fd7`; manifiesto de 22 archivos `BE-004-candidate-v3.sha256`, SHA-256 `959d4d487bed77abaa0d7ad1404e65f5eab7e4849e24058aba575cff4050fb1f`. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o de cualquier hash del manifiesto |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE004-AC01 | Refresh válido emite access y un único sucesor por canal. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC02 | Familia revocada, expirada o inválida nunca se renueva ni revela contexto. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC03 | La rotación conserva el límite absoluto de 30 días. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC04 | Resultado crítico auditado transaccionalmente con correlationId saneado y sin secretos/PII completa. | v2, ADR-021 Decisión | `4BE44B17…1825D2` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| v1 estable | RF-AUT-004, ADR-008, ADR-020 y OpenAPI `/auth/refresh`. | Paquete v1 | Rotación, canal, replay, límite, errores y privacidad sin cambio de contrato. |
| ADR21-AUTH-AUDIT | Puerto público audit con contexto técnico derivado, allowlist y propiedad de módulo. | ADR-021, Decisión | Sin acceso `identityaccess` a tabla/adaptador interno de audit. |
| ADR21-TX | Auditoría crítica y rotación comparten transacción PostgreSQL; responder después de commit. | ADR-021, Decisión | Rollback físico demostrado. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| REST estable | `docs/api/openapi.yaml`, `/auth/refresh` | Sin modificación; implementación de sus respuestas/headers/canales. | FE-003, MOB-002, INT-002/003 |
| Contrato intra-backend | `audit/.../RecordAuthenticationAuditUseCase` | Auditoría anónima tipada y transaccional. | `identityaccess` |
| Backend/migración | Archivos del manifiesto v3, incluida V10 | Refresh, rotación CAS, historial/replay, rate limiter y pruebas. | PostgreSQL/Redis/auth |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Renovación, replay, limitador, auditoría y transacción | En alcance | Manifiesto v3; handoff Dev |
| OpenAPI, logout y auditoría genérica | Fuera de alcance | ADR-021 |
| Redis/DB degradados | Riesgo residual gestionado | `503` fail-closed; PostgreSQL fuente de verdad |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY reutilizado | SEC-BE004-01..10 siguen vigentes; Dev declara evidencia para todos. | `docs/handoffs/security/BE-004-preflight.md`; `docs/handoffs/backend/BE-004-remediation-handoff.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE004-01..10 | Matriz sin cambio desde v1/v2. | Según preflight, ADR-021 y candidato v3. | QA debe verificar cada control sin reejecutar evidencia válida sin causa. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| QA afectado | Paquete v3 + handoff Dev + manifiesto | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Criterios y diez `SEC-*` |
| Seguridad final | Paquete v3 + Dev + QA + manifiesto | `PASS`/otro estado | Misma versión candidata y controles completos |
| DoF | Paquete v3 + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Commit, PR y CI del mismo candidato |

## Regla de excepción

Se reutilizan las fuentes registradas en v1/v2. Cualquier relectura debe declarar motivo, ruta, sección y hash en el handoff; un cambio de manifest/fuente exige v4.

## Ruta de remediación

La remediación de Desarrollo concluyó `READY_FOR_HANDOFF`; continuar solamente `QA afectado → Seguridad final → DoF` sobre el manifiesto v3.
