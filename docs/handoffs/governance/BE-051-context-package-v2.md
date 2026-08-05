# Paquete de Contexto de Historia — BE-051 — v2

**Sustituye para fases nuevas:** `BE-051-context-package.md` v1. La v1 y su
handoff `BLOCKED` se conservan como evidencia del bloqueo que ADR-020 resuelve.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-051-registrar-acciones-criticas.md` — SHA-256 `19566ed6b96054cb06f58f8f2ce10e3eff8fd2b31b47758f9e24ebe3c0bdd8c6` |
| Commit o diff candidato | Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`; candidato documental inicial: ADR-016 actualizado, ADR-020 nuevo y evidencias v1 sin cambio de `backend/followupbussiness`. No hay PR ni CI solicitados. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| BE051-AC-01 | Toda acción crítica registrada contiene tenant/empresa, actor técnico, acción, recurso/entidad e identificador, fecha/hora servidor y alcance mínimo. | HU, «Criterios» y «Datos»; contrato RF-AUD-002; ADR-020 D1 | `19566ed6…bdd8c6`; `62974da2…9db6b2`; `68db79d4…299be` |
| BE051-AC-02 | Conserva `before`/`after` solo para campos permitidos y saneados, nunca secretos, tokens, payloads completos ni datos personales innecesarios. | HU, «Seguridad»/«Fuera de alcance»; ADR-020 D1 | `19566ed6…bdd8c6`; `68db79d4…299be` |
| BE051-AC-03 | El modelo es append-only: no hay actualización/eliminación ordinaria, y las correcciones se agregan como nueva entrada. | HU, «Criterios»; OpenAPI `GET /audit-entries`; ADR-020 D2 y «Alternativas» 4 | `19566ed6…bdd8c6`; `8957594b…0792d9`; `68db79d4…299be` |
| BE051-AC-04 | `audit_entry` se retiene 365 días y `audit_network_context` 90; la purga física es diaria, idempotente, por lotes y excluye vencidos en consulta. | HU, «Criterios»; ADR-020 D3–D4 | `19566ed6…bdd8c6`; `68db79d4…299be` |
| BE051-SEC-01 | Tenant derivado de identidad, autorización por recurso y segregación de datos/red por tenant; ninguna entrada concede alcance. | HU, «Seguridad»; API traceability 1–3; ADR-020 D2 | `19566ed6…bdd8c6`; `dadd7643…07a67`; `68db79d4…299be` |
| BE051-OBS-01 | Éxito, denegación y error registran actor, acción, resultado, recurso/alcance y `correlationId`; telemetría sin datos sensibles. | HU, «Observabilidad»; ADR-020 D2/D4 | `19566ed6…bdd8c6`; `68db79d4…299be` |
| BE051-CON-01 | Reintentos/concurrencia no alteran ni duplican registros; job de purga no borra antes del corte ni falla por doble borrado. | HU, «Datos y casos límite»; ADR-020 D4–D5 | `19566ed6…bdd8c6`; `68db79d4…299be` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| RF-AUD-001/002 | Registrar acciones relevantes con empresa, usuario, acción, entidad, identificador, fecha/hora e historial anterior/nuevo cuando aplica. | `00_CONTRATO_FUNCIONAL.md`, RF-AUD-001/002 | Vocabulario controlado y datos mínimos por acción. |
| API-tenant | Tenant desde token; rol no reemplaza pertenencia/autoridad por recurso; errores incorporan correlación. | `docs/api/TRACEABILITY.md`, reglas 1–6 | No aceptar tenant de entrada como autoridad; proteger lectura y escritura. |
| ADR20-D1 | Allowlist por acción, actor técnico y contexto de red segregado; IP solo para categorías autorizadas. | ADR-020, D1 | No usar entidades genéricas de payload ni exponer IP por API de auditoría. |
| ADR20-D2 | PostgreSQL append-only, privilegios mínimos y transacción conjunta con la mutación crítica. | ADR-020, D2 | Puerto de auditoría propio; ningún dominio accede a tablas internas de `audit`. |
| ADR20-D3/D4 | 365/90/30 días; purga diaria física por lotes ≤500, con métricas saneadas y restauración en cuarentena. | ADR-020, D3–D4 | Migración, selección protegida, pruebas de borde y operación reproducible. |
| ADR20-D5 | Índices por tenant/fecha/actor/acción/recurso y pruebas de integridad, tenant, retención y concurrencia. | ADR-020, D5 | Pruebas dirigidas obligatorias; no declarar listo sin ellas. |
| Backend-invariantes | Monolito modular hexagonal, PostgreSQL fuente de verdad, migraciones versionadas y consultas con `tenantId`. | `backend/followupbussiness/AGENTS.MD`, «Invariantes» | Dominio `audit` mantiene sus propios puertos y adaptadores. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| ADR de retención | `docs/architecture/adr/ADR-020-retencion-auditoria-mvp.md`, D1–D5 | Fuente vigente de política de auditoría MVP. | BE-051, BE-052, INT-025, Seguridad/Operación |
| Contrato REST | `docs/api/openapi.yaml`, `GET /audit-entries`, `AuditEntry` | Comprobar coherencia: no exponer IP ni campos prohibidos; no modificar de forma silenciosa. | BE-052, FE-032, INT-025 |
| Módulo destino | `backend/followupbussiness/.../audit/` | Dominio, aplicación, puertos, adaptador JDBC, configuración/job y migración mínimos. | Productores de acciones críticas, BE-052 |
| Persistencia de red | Nueva tabla `audit_network_context` si se implementa en esta HU | Separada, restringida y con retención 90 días; no exponer por el endpoint general. | Seguridad autorizada |
| Referencia técnica existente | `identityaccess/.../AccessDecisionAuditPort` y adaptador JDBC | No compartir tablas ni repositorios; solo referencia de trazabilidad técnica. | identityaccess |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Registro crítico saneado, append-only, tenant/recurso, correlación, resultado y retención | En alcance | HU; ADR-020 D1–D5 |
| Job de purga y garantías de restauración | En alcance de la capacidad; implementación mínima según partes de BE-051 | ADR-020 D4–D5 |
| Órdenes de conservación legal | Fuera de alcance de BE-051 | ADR-020 D3 |
| Secretos, tokens, documentos completos, coordenadas/payloads completos y exposición de IP | Prohibido | HU; ADR-020 D1 |
| El periodo de 365 días no es asesoramiento ni cobertura regulatoria futura | Riesgo residual | ADR-020 «Riesgos» |
| Cambio de plazos/categorías/mecanismo | Requiere ADR sucesor y revisión Seguridad/Legal | ADR-020 D5 |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo | Este paquete v2; candidato indicado; handoff v1 como antecedente; ruta `docs/handoffs/backend/BE-051-development-handoff-v2.md` | `READY_FOR_HANDOFF` o `BLOCKED` | Implementación y pruebas dirigidas; documentar excepción de fuente. |
| QA | Paquete v2 + handoff Dev v2 + candidato fijado + evidencias Dev; ruta `docs/handoffs/qa/BE-051-qa-handoff.md` | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba, independencia y mismo candidato. |
| Seguridad | Paquete v2 + handoff QA + candidato + evidencias; ruta `docs/handoffs/security/BE-051-security-handoff.md` | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Obligatoria: auditoría privilegiada, tenant/recurso, minimización, integridad y operación de purga. |
| DoF | Paquete v2 + todos los handoffs + PR/CI + candidato | `PASS`/`BLOCKED` | Mismo commit/diff, PR y CI en todos los handoffs; ausencia de PR/CI se declara, no se inventa. |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff el motivo, ruta, sección, hash y resultado. Un cambio de hash invalida
este paquete y requiere una nueva versión del Orquestador.
