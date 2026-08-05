# Paquete de Contexto de Historia — BE-004 — v5

**Sustituye para QA afectado, Seguridad final y DoF:** `BE-004-context-package-v4.md`. V5 incorpora exclusivamente la remediación ordenada por Seguridad de `SEC-BE004-02` y `SEC-BE004-09`.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-004-renovar-sesion.md` — SHA-256 `FCE3CEE262C5C8C1C4E6E1F1BBC8F2C01A8CCBD5A0212F60152D49180A66BD74` |
| Commit o diff candidato | Base `a7e444a684d032be4da9ee4aac48528a33bd5fd7`; 22 archivos en `BE-004-candidate-v5.sha256`, SHA-256 del archivo `9849c3ddc25357d33db5c92ceab576864359afe9773201c6d9b4d0d186991c45`. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o de cualquier hash del manifiesto |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE004-AC01 | Refresh válido emite access y único sucesor por canal. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC02 | Familia inválida/revocada/expirada no renueva ni revela contexto. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC03 | Se conserva expiración absoluta de 30 días. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC04 | Resultado crítico auditado atómicamente, con correlationId y razón técnica cerrada, sin secreto/PII completa. | v2, ADR-021; remediación Seguridad | `B6595477…A12ADA` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| v1 estable | RF-AUT-004, ADR-008, ADR-020 y OpenAPI `/auth/refresh`. | Paquete v1 | Sin cambio contractual. |
| ADR21-AUTH-AUDIT/TX | Audit propietario, puerto tipado y transacción conjunta. | ADR-021, Decisión | Sin acceso interno entre módulos, rollback antes de respuesta. |
| SEC02-REMEDIATION | CSRF WEB se rota y persiste en el mismo CAS que refresh. | Handoff Seguridad, SEC-BE004-02 | C0→C1→C2; C0 no es válido tras rotación. |
| SEC09-REMEDIATION | Replay conserva correlationId y razón técnica allowlisted. | Handoff Seguridad, SEC-BE004-09 | Auditoría/HTTP correlacionables sin token/payload. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| Candidato verificable | `BE-004-candidate-v5.sha256` | 22 huellas de la remediación limitada. | QA, Seguridad, DoF |
| REST estable | `docs/api/openapi.yaml`, `/auth/refresh` | Sin modificación. | FE-003, MOB-002, INT-002/003 |
| Backend | RefreshSessionPort/Adapter/Service, audit adapter, V10 y pruebas del manifiesto | CSRF CAS y auditoría replay correlacionada. | auth/audit/PostgreSQL/Redis |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| CSRF sucesor persistido dentro de CAS | Remediación SEC-02 | Handoff Dev de remediación Seguridad |
| CorrelationId/razón técnica persistidos para replay | Remediación SEC-09 | Handoff Dev de remediación Seguridad |
| Resto de controles y OpenAPI | Sin cambio; evidencia v4 reutilizable | QA PASS y Seguridad final previa |
| Redis/HMAC/proxy y purga de digests | Riesgo residual operativo | Preflight/Seguridad |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY reutilizado | Controles SEC-01..10; la revisión final v4 pidió remediar solo 02/09. | `BE-004-preflight.md`; `BE-004-security-review.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE004-02 | CSRF sucesor no persistido. | Actualizar digest CSRF en CAS/transaction. | Dos refresh WEB consecutivos aceptan C1 y rechazan C0. | Sí |
| SEC-BE004-09 | Replay no correlacionable. | Propagar correlationId/razón técnica cerrada a auditoría. | Respuesta y `audit_entry` coinciden, sin secreto. | Sí |
| SEC-BE004-01/03..08/10 | Sin cambio. | Evidencia v4 reutilizable si manifiesto v5 no altera su superficie. | QA verifica no regresión y reutiliza pruebas justificadamente. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| QA afectado | Paquete v5 + remediación Dev + manifiesto | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | SEC-02/09 y no regresión |
| Seguridad final | Paquete v5 + QA afectado + manifiesto | `PASS`/otro estado | SEC-01..10 sobre v5 |
| DoF | Paquete v5 + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Commit, PR y CI del mismo candidato |

## Regla de excepción

No se reabren fuentes primarias. V5 cambia solo las superficies y huellas declaradas por el handoff de Seguridad; una variación posterior exige v6.

## Ruta de remediación

Ejecutar únicamente `QA afectado → Seguridad final → DoF`; no repetir el preflight ni la QA v4 completa.
