# Paquete de Contexto de Historia — BE-051 — v3

**Sustituye para gates posteriores:** paquete v2. Se emite porque Desarrollo
modificó el candidato; los criterios y fuentes de v2 permanecen vigentes.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-051-registrar-acciones-criticas.md` — SHA-256 `19566ed6b96054cb06f58f8f2ce10e3eff8fd2b31b47758f9e24ebe3c0bdd8c6` |
| Candidato | Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` + manifest SHA-256 `8db12091eccfca68b36c746445991c12add6a69bcf2a298e446a7daa6c6423ca` de ADR-016/020, módulo `audit`, V8 y pruebas audit. Sin commit, PR ni CI solicitados. |
| Handoff de entrada | `docs/handoffs/backend/BE-051-development-handoff-v2.md` — `READY_FOR_HANDOFF`, SHA-256 `7391469209597f639605b48c1e20158f6ffe7a3750aede511cc6538a4adbd783` |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios normalizados y evidencia Dev

| ID | Criterio verificable | Regla/fuente | Evidencia Dev que QA debe confirmar |
|---|---|---|---|
| BE051-AC-01 | Entry con tenant, actor técnico, acción, recurso/ID, resultado, correlación, alcance y hora servidor. | HU; RF-AUD-002; ADR-020 D1 | `AuditEntry`, `AuditAction`, `AuditResult`, V8, `AuditEntryMigrationTest`. |
| BE051-AC-02 | `before`/`after` solo allowlist saneada; sin secretos, tokens, payloads ni PII innecesaria. | HU; ADR-020 D1 | Allowlist `status`, validación de dominio y `CHECK` JSONB V8. |
| BE051-AC-03 | Append-only, sin operaciones ordinarias de update/delete; corrección por nueva entrada. | HU; ADR-020 D2 | `JdbcAuditEntryStore.append`, `ON CONFLICT DO NOTHING`, ausencia de API mutable. |
| BE051-AC-04 | 365 días entry, 90 contexto de red; purga física, diaria, por lotes ≤500, idempotente y sin mostrar vencidos. | HU; ADR-020 D3–D4 | `PurgeAuditRetention`, scheduler, V8 y prueba de corte. |
| BE051-SEC-01 | Tenant de identidad/alcance y autorización por recurso; contexto de red separado y no público. | HU; API traceability 1–3; ADR-020 D1–D2 | Tenant obligatorio, FK compuesta y ninguna ruta REST añadida. |
| BE051-OBS-01 | Actor, acción, resultado, recurso/alcance y `correlationId`; métricas saneadas. | HU; ADR-020 D2/D4 | Campos de entrada y métricas de purge. |
| BE051-CON-01 | Reintentos/concurrencia no duplican ni borran antes de corte. | HU; ADR-020 D4–D5 | PK/`ON CONFLICT`, `FOR UPDATE SKIP LOCKED`, test integrado. |

## Reglas y decisiones aplicables

| ID | Regla | Fuente y hash | Aplicación |
|---|---|---|---|
| RF-AUD-001/002 y RNF-006..008 | Acciones relevantes trazables, datos mínimos, tenant/rol/permisos y protección/retención. | `00_CONTRATO_FUNCIONAL.md`, `62974da2…9db6b2` | Solo acciones y datos permitidos; no alcance otorgado por input. |
| API-tenant | Tenant desde token; rol mínimo no reemplaza recurso; errores con correlación. | `docs/api/TRACEABILITY.md`, `dadd7643…07a67` | No crear endpoint anticipado para BE-052. |
| ADR20-D1..D5 | Minimización, append-only, 365/90/30, purga/restauración e índices/pruebas. | ADR-020, `68db79d4…299be` | Auditoría independiente y persistencia PostgreSQL. |
| ADR16-referencia | ADR-016 delega la política de auditoría a ADR-020. | ADR-016 §Dependencias, `2d281cfaf7f4085d0ec93705c01686737faeebe9c7bb36e9e786837eb385815d` | No aplicar la retención de ubicaciones a auditoría. |
| Invariantes backend | Hexagonal por dominio, PostgreSQL, migraciones versionadas y tenant en consultas. | `backend/followupbussiness/AGENTS.MD`, `4bea3fd0…3a4c1` | No compartir tablas/repositorios entre `audit` e `identityaccess`. |

## Artefactos y alcance del candidato

| Tipo | Ruta | Estado esperado |
|---|---|---|
| Política | `docs/architecture/adr/ADR-020-retencion-auditoria-mvp.md` | Vigente; no volver a decidir plazos. |
| Implementación | `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/` | Dominio, puertos, JDBC y scheduler. |
| Migración | `backend/followupbussiness/src/main/resources/db/migration/V8__create_audit_entries.sql` | Tablas/índices/restricciones. |
| Pruebas Dev | `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/` | 4 pruebas dirigidas ejecutadas contra PostgreSQL/Testcontainers. |
| Contrato | `docs/api/openapi.yaml`, `GET /audit-entries` / `AuditEntry` | Sin cambio: BE-051 no anticipa la lectura de BE-052. |

## Riesgos

- 365 días es una decisión operativa MVP, no asesoramiento legal; cambios
  requieren ADR sucesor y revisión de Seguridad/Legal.
- La allowlist hoy solo admite `status`; nuevos campos/categorías exigen cambio
  explícito y trazable.
- La limpieza de `target` resolvió clases obsoletas; no hubo cambio de POM ni
  debilitamiento de pruebas.

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| QA | Este paquete v3 + handoff Dev v2 + candidato | Handoff `PASS`/`CHANGES_REQUIRED`/`BLOCKED` en `docs/handoffs/qa/BE-051-qa-handoff.md` | Reproducir pruebas dirigidas y validar matriz/aislamiento/retención/concurrencia. |
| Seguridad | Paquete v3 + handoff QA + candidato | Handoff `PASS`/otro estado en `docs/handoffs/security/BE-051-security-handoff.md` | Obligatoria: privilegios, minimización, append-only y job de purga. |
| DoF | Paquete v3 + Dev/QA/Seguridad + PR/CI + candidato | `PASS`/`BLOCKED` | Mismo manifest, PR y CI; ausencia de PR/CI se declara. |

## Regla de excepción

No releer fuentes primarias ya listadas. Si es indispensable, registrar en el
handoff motivo, ruta, sección, hash y resultado. Cambiar una fuente o el
candidato requiere un paquete nuevo del Orquestador.
