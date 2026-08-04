# Paquete de Contexto de Historia — BE-051 — v1

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-051-registrar-acciones-criticas.md` — SHA-256 `19566ed6b96054cb06f58f8f2ce10e3eff8fd2b31b47758f9e24ebe3c0bdd8c6` |
| Commit o diff candidato | `03cddd578850f77acd1a1d1035fef031f7ac7384` (`HEAD`); worktree de aplicación limpio al fijarlo; sin PR ni ejecución CI solicitados |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE051-AC-01 | Toda acción crítica registrada contiene empresa/tenant, actor, acción, entidad/recurso, identificador y fecha/hora. | HU, «Criterios de aceptación»; `00_CONTRATO_FUNCIONAL.md`, RF-AUD-002 | `19566ed6…bdd8c6`; `62974da2…9db6b2` |
| BE051-AC-02 | El registro conserva el valor anterior y nuevo solo cuando estén permitidos y saneados. | HU, «Criterios de aceptación» y «Seguridad y privacidad»; contrato, RF-AUD-002 | `19566ed6…bdd8c6`; `62974da2…9db6b2` |
| BE051-AC-03 | El modelo de auditoría es append-only/inmutable para uso ordinario; no ofrece modificación ni eliminación operativa. | HU, «Criterios de aceptación»; OpenAPI, `GET /audit-entries` («auditoría inmutable») | `19566ed6…bdd8c6`; `8957594b…0792d9` |
| BE051-AC-04 | La retención de los registros de auditoría queda definida, implementable y verificable, sin inventar duración ni mecanismo. | HU, «Criterios de aceptación»; ADR-016, «Dependencias, fuera de alcance y riesgos» | `19566ed6…bdd8c6`; `efec69b0…8a8ff` |
| BE051-SEC-01 | El tenant procede de la identidad autenticada y se valida autorización por recurso; ningún valor de entrada concede alcance. | HU, «Seguridad y privacidad»; API traceability, «Reglas transversales verificables» 1–3; AGENTS Backend, «Invariantes» | `19566ed6…bdd8c6`; `dadd7643…07a67`; `4bea3fd0…3a4c1` |
| BE051-OBS-01 | Se captura/propaga `correlationId`, actor técnico, acción, resultado y alcance mínimo; errores y telemetría no filtran datos sensibles. | HU, «Observabilidad»; API traceability, regla 6 | `19566ed6…bdd8c6`; `dadd7643…07a67` |
| BE051-CON-01 | Reintentos y concurrencia no duplican ni alteran un registro de auditoría; las mutaciones relevantes tienen protección de concurrencia aplicable. | HU, «Datos, reglas y casos límite»; API traceability, reglas 4–5 | `19566ed6…bdd8c6`; `dadd7643…07a67` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| RF-AUD-001 | Registrar inicio de sesión y cambios críticos de clientes, rutas, visitas, ventas, anulaciones y configuración. | `00_CONTRATO_FUNCIONAL.md`, RF-AUD-001 | Definir un vocabulario controlado de acciones y puntos de emisión, sin ampliar silenciosamente el contrato. |
| RF-AUD-002 | Campos auditables: empresa, usuario, acción, entidad, identificador, fecha/hora, IP/dispositivo cuando aplique, anterior/nuevo. | `00_CONTRATO_FUNCIONAL.md`, RF-AUD-002 | Persistir el mínimo necesario; actor técnico/resultado/correlación completan el alcance de esta HU. |
| RNF-006..008 | Validar empresa, usuario, rol y permisos; aplicar finalidad/retención/acceso controlado; trazabilidad crítica. | `00_CONTRATO_FUNCIONAL.md`, RNF-006..008 | Toda escritura y lectura futura mantiene aislamiento multiempresa y autorización por recurso. |
| API-tenant | Tenant derivado del token; rol mínimo no sustituye pertenencia al tenant, equipo o recurso; errores incluyen `correlationId`. | `docs/api/TRACEABILITY.md`, «Reglas transversales verificables» 1–6 | No aceptar `tenantId` como autoridad ni registrar secretos/payloads completos. |
| ADR-016-telemetría | Logs, métricas y eventos técnicos se sanitizan: sin payload ni identificadores personales expuestos. | `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`, D3–D4 | Aplicar por analogía de minimización a la observabilidad de auditoría; no trasladar la retención de ubicaciones a auditoría. |
| ADR-016-retención | La política detallada de auditoría está fuera de ADR-016 y pendiente. | `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`, «Dependencias, fuera de alcance y riesgos» | Riesgo bloqueante de AC-04: Desarrollo debe localizar una decisión posterior estable o devolver `BLOCKED`; no inventar plazo, purga ni excepción. |
| Backend-invariantes | Hexagonal modular, PostgreSQL fuente de verdad, migraciones versionadas y consultas multiempresa con `tenantId`. | `backend/followupbussiness/AGENTS.MD`, «Invariantes» | Modelo/puertos/adaptadores y migración audit no cruzan repositorios internos de otros dominios. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| Contrato REST existente | `docs/api/openapi.yaml`, `GET /audit-entries`, `AuditEntry`, `AuditEntryPage` | Verificar coherencia de los campos obligatorios con el registro producido; cambiar el contrato solo si la HU lo exige y documentarlo. | BE-052, FE-032, INT-025 |
| Persistencia existente de referencia | `backend/followupbussiness/src/main/resources/db/migration/V2__create_identity_access_account_and_bootstrap_audit.sql` | No reutilizar indebidamente la auditoría técnica de bootstrap; crear migración versionada del dominio `audit` si procede. | Backend, PostgreSQL |
| Adaptador de auditoría técnica existente | `identityaccess/.../AccessDecisionAuditPort` y `JdbcAccessDecisionAuditAdapter` | Mantener límites de dominio; puede servir de referencia de campos técnicos, no de repositorio compartido. | identityaccess |
| Módulo destino | `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/` | Implementar dominio, aplicación, puertos y adaptador de persistencia mínimos, con pruebas dirigidas. | Historias productoras y BE-052 |
| Retención | Sin contrato/ADR específico estable localizado en fuentes trazadas | No implementar duración o purga como supuesto. Requiere decisión aprobada antes de satisfacer AC-04. | INT-031, Operación, Legal/Privacidad |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Registro de acciones críticas, historial antes/después saneado, correlación y resultado | En alcance | HU, «Alcance», «Criterios», «Observabilidad» |
| Aislamiento por tenant y autorización por recurso | En alcance / seguridad obligatoria | HU, «Seguridad y privacidad»; API traceability 1–3 |
| Inmutabilidad, append-only, concurrencia/reintento y pruebas de trazabilidad | En alcance / alto riesgo | HU, «Datos, reglas y casos límite»; API traceability 4–5 |
| Secretos, tokens, payloads completos, documentos completos y coordenadas innecesarias | Fuera de alcance / prohibido registrar | HU, «Fuera de alcance» y «Seguridad y privacidad» |
| Retención concreta de auditoría | Riesgo bloqueante | ADR-016 declara que sigue fuera de alcance y pendiente; no hay duración, purga ni responsable técnico aprobados en las fuentes trazadas. |
| OpenAPI permite `before`/`after` con propiedades abiertas | Riesgo de privacidad | `docs/api/openapi.yaml`, `AuditEntry`; requerirá lista permitida/saneamiento y prueba negativa. |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo | Este paquete v1; candidato `03cddd…7384`; ruta de evidencias `docs/handoffs/backend/BE-051-development-handoff.md` | Handoff `READY_FOR_HANDOFF` o `BLOCKED`; código, pruebas dirigidas y matriz criterio → evidencia | Implementación y pruebas dirigidas; documentar cualquier excepción de fuente. |
| QA | Paquete vigente + handoff Dev + candidato fijado + evidencias Dev; ruta `docs/handoffs/qa/BE-051-qa-handoff.md` | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba, independencia y mismo candidato. |
| Seguridad | Paquete vigente + handoff QA + candidato fijado + evidencias previas; ruta `docs/handoffs/security/BE-051-security-handoff.md` | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Obligatoria: auditoría privilegiada, tenant/recurso, minimización, integridad y observabilidad. |
| DoF | Paquete vigente + todos los handoffs + PR/CI + candidato | `PASS`/`BLOCKED` | Mismo commit/diff, PR y CI en todos los handoffs; sin PR/CI no inventar evidencia. |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de
hash invalida este paquete y requiere una nueva versión del Orquestador.
