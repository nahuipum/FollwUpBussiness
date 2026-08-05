# Paquete de Contexto de Historia — BE-004 — v4

**Sustituye para QA, Seguridad final y DoF:** `BE-004-context-package-v3.md`.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-004-renovar-sesion.md` — SHA-256 `FCE3CEE262C5C8C1C4E6E1F1BBC8F2C01A8CCBD5A0212F60152D49180A66BD74` |
| Commit o diff candidato | Base `a7e444a684d032be4da9ee4aac48528a33bd5fd7`; 22 archivos con hashes individuales en `BE-004-candidate-v3.sha256`. SHA-256 del archivo de manifiesto almacenado: `8036c6ad13e483e99fcbb0288bbb3b9b59f7df78a5d4e3d195667b68706ec83e`. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o de cualquier hash del manifiesto |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE004-AC01 | Refresh válido emite access y único sucesor por canal. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC02 | Familia inválida/revocada/expirada no renueva ni revela contexto. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC03 | Se conserva expiración absoluta de 30 días. | v1, BE-004/ADR-008 | `FCE3CEE2…A66BD74`; `26542BF2…40DEC` |
| BE004-AC04 | Resultado crítico auditado atómicamente y sin secretos/PII completa. | v2, ADR-021 Decisión | `4BE44B17…1825D2` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| v1 estable | RF-AUT-004, ADR-008, ADR-020 y OpenAPI `/auth/refresh`. | Paquete v1 | Sin cambio de contrato. |
| ADR21-AUTH-AUDIT | Puerto audit tipado y propiedad del módulo. | ADR-021, Decisión | Sin acceso interno entre dominios. |
| ADR21-TX | Misma transacción PostgreSQL para auditoría crítica y rotación. | ADR-021, Decisión | Rollback físico antes de respuesta. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| Candidato verificable | `docs/handoffs/governance/BE-004-candidate-v3.sha256` | Mismas 22 huellas de código/ADR de v3; solo se corrige el hash agregado del archivo real. | QA, Seguridad, DoF |
| REST estable | `docs/api/openapi.yaml`, `/auth/refresh` | Sin modificación. | FE-003, MOB-002, INT-002/003 |
| Backend | Archivos contenidos en el manifiesto | Implementación y pruebas BE-004. | auth/audit/PostgreSQL/Redis |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Corrección de inmutabilidad | En alcance de orquestación | QA v3: 22/22 hashes válidos; solo agregación incorrecta. |
| Cambio de código, contrato o requisitos | Fuera de esta corrección | No cambió ninguna huella individual. |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| ADVISORY reutilizado | SEC-BE004-01..10 sin cambio. | `docs/handoffs/security/BE-004-preflight.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE004-01..10 | Matriz v1/v2 sin cambio. | Según preflight y ADR-021. | QA afectado vuelve a evaluar sobre v4. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| QA afectado | Paquete v4 + Dev READY + manifiesto | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Manifiesto 22/22 y criterios/SEC |
| Seguridad final | Paquete v4 + Dev + QA + manifiesto | `PASS`/otro estado | Mismo candidato y controles |
| DoF | Paquete v4 + todos los handoffs + PR/CI | `PASS`/`BLOCKED` | Commit, PR y CI del mismo candidato |

## Regla de excepción

No se reabren fuentes primarias. La v4 se debe exclusivamente a la discrepancia reproducible del hash agregado del archivo de manifiesto; las huellas individuales verificadas no cambiaron.

## Ruta de remediación

Ejecutar `QA afectado → Seguridad final → DoF`. El QA v3 bloqueado queda como evidencia de control de inmutabilidad y no se repite Desarrollo.
