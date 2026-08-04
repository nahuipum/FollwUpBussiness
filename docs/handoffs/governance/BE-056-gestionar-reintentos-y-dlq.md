# Paquete de Contexto de Historia — BE-056 — v3

## Estado v3 — fuente de verdad vigente

| Campo | Valor |
|---|---|
| Candidato funcional fijado | `2ad78920b3b0178d44bc5379d5d1b5c26ff5f131` en `feature/be-056-dlq` (PR #7). |
| Base funcional | `dc8979e8…` (BE-056) + `d83b166…` (corrección de contextos CI y prefijos activos). `0651804…` homologa nombres y `2ad7892…` añade únicamente orquestación/plantillas. |
| Fuentes primarias | Se reutilizan las rutas, secciones y hashes de v2: no cambiaron la HU, ADR-019, OpenAPI, contrato de eventos ni migración V6. No se autoriza relectura salvo excepción en handoff. |
| Evidencia reutilizable | `mvn clean verify` local en `d83b166…`: PASS; CI del candidato `2ad7892…`: EN-010 PR #7 PASS, EN-011 push PASS y EN-011 PR reejecutado en curso al crear v3. |
| Cambio posterior de fase | No hay cambio funcional posterior a la remediación de Seguridad; los cambios posteriores son trazabilidad, naming y orquestación. |

v3 invalida las huellas de diff no comprometidas de v2 y fija un commit Git
verificable. Las secciones v2 siguientes se conservan como registro histórico;
las fases Dev, QA, Seguridad y DoF deben añadir su adenda v3 con esta misma
huella y las excepciones de lectura/prueba que realicen.

## Registro histórico v2

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-056-gestionar-reintentos-y-dlq.md` |
| Candidato | `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f` + worktree actual, `git diff HEAD` SHA-1 `c653ae823b961ba82389f6bce1891f12bf6f9141` |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de cualquiera de las fuentes o del candidato |
| Alcance fijado | Validar el reproceso DLQ en `POST /api/v1/internal/outbox/dlq/{eventId}/reprocess`: rol `PLATFORM_SUPERADMIN` e identidad UUID del operador derivada de la autenticación; sin cuerpo ni `tenantId` de cliente. |

v2 sustituye v1 porque Desarrollo añadió la prueba de propagación del operador
UUID autenticado. Las fuentes primarias conservan sus hashes. El candidato
contiene cambios no relacionados; cada fase revisará únicamente los
archivos BE-056 y declarará cualquier ampliación. No hay commit, PR ni CI
inmutable solicitados.

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| CA-1 | Los fallos transitorios se reintentan un máximo de ocho veces con backoff+jitter, sin bucle infinito. | Historia: criterios 1; ADR-019: Decisión 1 | `9DF35F…A8F25`; `D13F1C…C8FC12` |
| CA-2 | Fallos permanentes y agotados pasan atómicamente a DLQ PostgreSQL, conservando evidencia durable. | Historia: criterio 2; ADR-019: Decisión 2–3 | `9DF35F…A8F25`; `D13F1C…C8FC12` |
| CA-3 | `eventId`, tenant y correlation/causation IDs se preservan; el endpoint no acepta identidad ni tenant del cliente. | Historia: criterio 3 y seguridad; ADR-019: Decisión 3–4; events README: Envelope/DLQ | `9DF35F…A8F25`; `D13F1C…C8FC12`; `C3E947…DE36A0` |
| CA-4 | Se emiten métricas operativas de DLQ y existe soporte de alerta sin payload/PII. | Historia: criterio 4/observabilidad; ADR-019: Decisión 5 | `9DF35F…A8F25`; `D13F1C…C8FC12` |
| VAL-1 | El endpoint solo permite `PLATFORM_SUPERADMIN`; rechaza anónimo, rol ausente e identidad no UUID; ejecuta con operador autenticado válido. | ADR-019: Decisión 4; OpenAPI: `/internal/outbox/dlq/{eventId}/reprocess` | `D13F1C…C8FC12`; `895759…792D9` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| RNF-014 | Logs y métricas para operación. | `00_CONTRATO_FUNCIONAL.md`: RNF-014 | Métricas/alertas y logs saneados. |
| ADR-019 | PostgreSQL es DLQ de publicación outbox; RabbitMQ DLQ queda en consumidores. | ADR-019: Decisión y consecuencias | Migración forward-only, transición atómica, límite de tres reprocesos y retención de 30 días. |
| API-056 | API interna 202/401/403/404; UUID de ruta, sin body o tenant. | OpenAPI: operación `reprocessOutboxDlqEvent` | Validar ruta, authN/authZ y coherencia controlador/configuración. |
| BE invariantes | Monolito modular, hexagonal, tenant confiable y sin DTO de persistencia. | `backend/followupbussiness/AGENTS.MD`: Invariantes | Revisar que el adaptador REST no contenga la regla ni permita manipular tenant. |
| Workflow | Handoffs breves, fases independientes y candidato sin cambios. | `shared/TEAM_WORKFLOW.md`: 0, paquete y DoF | Rechazar avance si cambia el hash candidato o falta handoff. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| REST | `docs/api/openapi.yaml`: `reprocessOutboxDlqEvent` | Mantener ruta, rol, respuestas y ausencia de body/tenant. | Operación de plataforma/QA. |
| Evento | `docs/events/README.md`: Envelope y Fallos de publicación y DLQ | IDs técnicos preservados; payload no se telemetra. | Publicador y consumidores. |
| Persistencia | `outbox` / migración `V6__create_transactional_outbox_dlq.sql` | DLQ durable, transición y reproceso atómicos. | Publicador/scheduler. |
| Seguridad | `SecurityConfiguration`, `DlqReprocessController` | Barrera de ruta y validación defensiva de autoridad/principal UUID. | Endpoint interno. |
| Observabilidad | `OutboxConfiguration`, alertas outbox | Profundidad, antigüedad, entradas y reprocesos. | Operación/Prometheus. |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Validación X / endpoint Y | Dentro: authZ de superadmin e identidad de operador UUID en reproceso DLQ. | Alcance fijado y VAL-1. |
| Reintentos/DLQ/métricas | Dentro. | CA-1 a CA-4. |
| DLQ RabbitMQ de consumidores | Fuera. | ADR-019: Decisión. |
| Riesgo crítico | Broken function authorization, BOLA entre tenants, replay y reencolado ilimitado. | Historia: Riesgos; ADR-019: Decisión 4. |
| Riesgo operativo | Telemetría/payload sensible y retención/foreign keys. | Historia: seguridad/observabilidad; ADR-019: Decisión 3 y 5. |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Desarrollo | Este paquete v2 y candidato fijado | `docs/handoffs/backend/BE-056-backend-handoff.md` con `READY_FOR_HANDOFF` o `BLOCKED` | Implementación y pruebas dirigidas. |
| QA | Paquete + Dev + mismo candidato | `docs/handoffs/backend/BE-056-backend-qa.md` con `PASS`/otro estado | Matriz criterio → prueba. |
| Seguridad | Paquete + QA + mismo candidato | `docs/handoffs/security/BE-056-security-review.md` con `PASS`/otro estado | Obligatoria: endpoint interno, rol, tenant y mensajería. |
| DoF | Paquete + tres handoffs + candidato | Reporte DoF `PASS`/`BLOCKED` | Evidencia reproducible del mismo candidato; sin PR/CI porque no se solicitó commit. |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el
handoff motivo, ruta, sección, hash y resultado. Un cambio de hash de fuente o
candidato invalida este paquete y requiere una versión nueva del Orquestador.

## Ejecución del flujo

| Fase | Estado | Evidencia / decisión |
|---|---|---|
| Desarrollo | `READY_FOR_HANDOFF` | `docs/handoffs/backend/BE-056-backend-handoff.md`; añadió prueba VAL-1 que verifica el UUID autenticado trasladado a `PlatformOperator`. Pruebas dirigidas y arquitectura: PASS. La prueba migratoria quedó condicionada a Docker/Testcontainers. |
| QA | `PASS` | `docs/handoffs/backend/BE-056-backend-qa.md`, sección **QA independiente — orquestación v2**; 52 pruebas dirigidas, incluida migración PostgreSQL/Testcontainers, controles 401/403/202 y verificación del UUID exacto. Excepción: consultó OpenAPI por estar modificado en el candidato; coincidió con el paquete. |
| Seguridad | `BLOCKED` | Handoff de Seguridad v2 recibido directamente del revisor (el rol no está autorizado a editar documentación). `SEC-BE056-01` High: falta autenticación inbound runtime que valide firma/sesión-revocación, `sub` UUID y rol para un superadmin real; las pruebas usan `with(user(...))`. `SEC-BE056-02` Medium: sin rate limit agregado por operador/origen. `SEC-BE056-03` Medium: auditoría solo conserva último actor/fecha, no historial append-only. |
| DoF | `BLOCKED` | No autorizado a ejecutarse: Seguridad no aprobó, según el gate de este paquete y `shared/TEAM_WORKFLOW.md`. |

### Integridad del candidato durante la ejecución

La huella canónica del diff rastreado se confirmó estable con
`git diff HEAD | git hash-object --stdin`:
`c653ae823b961ba82389f6bce1891f12bf6f9141`. Un SHA-1 de bytes crudos
calculado por `sha1sum` no era comparable y no representó un cambio.

Los artefactos nuevos no rastreados no participan en ese object ID. Seguridad
registró las siguientes huellas SHA-256 suplementarias: `DlqReprocessController`
`909B3176…4856EF`, `ReprocessOutboxEvent` `8E3343E8…E81DD`,
`PlatformOperator` `A38D1417…06870`, migración V6 `EECF8446…17670F`,
`SecurityConfiguration` `68EE6625…E1D1D`, `JdbcOutboxStore`
`A501F85A…50EC5`, OpenAPI `8957594B…792D9` y alertas
`2108F407…E7BDB`. Un commit futuro debe fijar el candidato completo antes de
un nuevo ciclo de gates/DoF.
