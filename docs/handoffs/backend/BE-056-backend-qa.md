# BE-056 — Backend QA independiente

## QA independiente — orquestación v2

Resultado emitido contra el paquete v2 y el candidato inmutable indicado abajo.

## Estado

`PASS`

## Paquete y candidato revisados

- Paquete: `docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v2.
- Handoff previo: `docs/handoffs/backend/BE-056-backend-handoff.md` (`READY_FOR_HANDOFF`).
- Candidato estable: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f` + worktree; SHA-1 de `git diff HEAD`: `c653ae823b961ba82389f6bce1891f12bf6f9141`.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia independiente |
|---|---|---|
| CA-1 | Límite de ocho intentos y backoff exponencial con jitter. | `OutboxPublisherTest` cubre reintento, octavo intento terminal y política; PASS. |
| CA-2 | Transición CTE `CLAIMED → TERMINAL + transactional_outbox_dlq`, migración V6, upsert y retención compatible con FK. | `TransactionalOutboxMigrationTest`; PASS con PostgreSQL 17/Testcontainers (8). Incluye límite de reproceso, auditoría al reingreso y retención. |
| CA-3 | V6 y persistencia conservan `eventId`, tenant y correlation/causation IDs; el controlador no declara body ni tenant de cliente. | `RabbitMqEventTransportTest` y `SecurityConfigurationTest`; PASS. |
| CA-4 | Gauges de profundidad/edad DLQ y contador de reprocesos configurados. | Inspección de `OutboxConfiguration`; regresión de scheduler PASS. Configuración operativa de alerta: `NOT_APPLICABLE` para esta fase. |
| VAL-1 | `SecurityFilterChain` exige `PLATFORM_SUPERADMIN`; controlador vuelve a validar autoridad y deriva UUID de `Authentication` a `PlatformOperator`. | `SecurityConfigurationTest`; 401 anónimo, 403 sin rol/no UUID, 202 superadmin y verificación del UUID exacto propagado: PASS. |
| Arquitectura | Adaptador REST en entrada, caso de uso sin dependencia de Spring y persistencia tras puerto. | `HexagonalArchitectureTest` y `ModuleBoundaryTest`; PASS. |

## Comandos y evidencia

- `mvn "-Dtest=SecurityConfigurationTest,OutboxPublisherTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 40 pruebas.
- `mvn "-Dtest=TransactionalOutboxMigrationTest" test`: PASS, 8 pruebas con PostgreSQL 17/Testcontainers.
- `mvn "-Dtest=RabbitMqEventTransportTest,OutboxPublishingSchedulerTest" test`: PASS, 4 pruebas.
- Total de las suites dirigidas independientes: PASS, 52 pruebas.
- `git diff --check HEAD`: PASS.

## Excepciones

- Se consultó selectivamente `docs/api/openapi.yaml` al detectar que el candidato modifica el contrato; se confirmó la ruta, rol, respuestas y ausencia de `requestBody`/`tenantId`, coherentes con el paquete v2.
- `graphify` no estaba disponible en `PATH`; no afectó la evidencia de código ni de pruebas.

## Hallazgos, regresión y riesgos residuales

- Hallazgos: ninguno.
- Regresión relevante: transporte RabbitMQ (confirmación y no enrutable), scheduler, autorización del endpoint, migración/retención y límites de arquitectura pasaron pruebas dirigidas.
- Riesgo residual: las métricas requieren alerta configurada y operada en Prometheus; no afecta el contrato ni la seguridad del endpoint.

---

## QA independiente — remediación de Seguridad (SEC-BE056-01/02/03)

### Estado

`PASS`

### Candidato y alcance

- Paquete vigente: `docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v2; handoff de Desarrollo: `READY_FOR_HANDOFF`.
- Candidato: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f` + worktree; huella de `git diff HEAD`: `6e9b87a44294f4b889796794f395b260b423c976`.
- Se revisaron solo la remediación inbound JWT/Bearer, límite Redis, endpoint DLQ y V6/JdbcOutboxStore; CA-1..4 y la regresión DLQ previa se reutilizan cuando no fueron afectados.

### Matriz resumida

| Criterio | Implementación | Prueba / evidencia |
|---|---|---|
| SEC-BE056-01 | `InboundJwtAuthenticationFilter` solo admite Bearer en el reproceso; `InboundJwtAuthenticator` exige RS256, `iss`, `aud`, expiración, `sub`/`sid` UUID, rol único `PLATFORM_SUPERADMIN`, sin `tid`, y sesión/cuenta/rol activo en PostgreSQL. `SecurityConfiguration` instala el filtro cuando está disponible. | `InboundJwtAuthenticatorTest` verifica firma alterada y claims tenant no admisibles; `SecurityConfigurationTest` verifica Bearer, 401, 403 por rol/UUID y 202 con operador UUID propagado. PASS. |
| SEC-BE056-02 | `DlqReprocessRateLimiter` aplica ventanas Redis de 20/min por operador y 60/min por origen con claves HMAC; el controlador responde 429 + `Retry-After`, y 503 si falta/falla el limitador. | `DlqReprocessRateLimiterTest` prueba agotamiento sin identificadores en claro; `SecurityConfigurationTest` prueba 429 y token alterado 401. 503 verificado por inspección del controlador; PASS. |
| SEC-BE056-03 | V6 crea `transactional_outbox_dlq_reprocess_audit` append-only y la CTE de `reprocessFromDlq` inserta auditoría antes de reenviar; FK `ON DELETE CASCADE` preserva retención. | `TransactionalOutboxMigrationTest` contiene el caso de tres reprocesos/tres operadores y la aserción de tres filas. NOT_EXECUTED localmente: Testcontainers no accede a Docker. Inspección SQL consistente; no se declara fallo de código. |
| Aislamiento y arquitectura | No se acepta tenant, actor, payload ni cuerpo HTTP; el actor proviene del JWT y el evento/tenant de la fila durable. Persistencia tras puerto y adaptadores en frontera. | `HexagonalArchitectureTest` (3) y `ModuleBoundaryTest` (1): PASS. |

### Comandos y evidencia

- `mvn -s C:\\tmp\\be056-maven-settings.xml "-Dtest=SecurityConfigurationTest,InboundJwtAuthenticatorTest,DlqReprocessRateLimiterTest,OutboxPublisherTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 44 pruebas (JDK 21).
- `mvn -s C:\\tmp\\be056-maven-settings.xml "-Dtest=TransactionalOutboxMigrationTest" test`: NOT_EXECUTED para evidencia funcional; Testcontainers no obtuvo acceso a `\\\\.\\pipe\\docker_engine` (Docker requiere privilegios en este entorno). No es un fallo de prueba ni de producto reproducido.
- `git diff --check`: PASS. Huella del diff confirmada: `6e9b87a44294f4b889796794f395b260b423c976`.
- `python -m graphify query ...`: NOT_EXECUTED; el intérprete Python del entorno no es accesible. No se usó como evidencia funcional.

### Hallazgos, regresión y riesgos residuales

- Hallazgos abiertos: ninguno.
- Reproducción de negativos cubierta: token firmado alterado o sin Bearer → 401; rol no permitido o `sub` no UUID → 403; cuota agotada → 429 con `Retry-After`; dependencia Redis ausente/no disponible → 503 por el controlador.
- Regresión relevante: publicación/reintentos y los límites hexagonales/de módulos pasan el conjunto dirigido. La migración/append-only sigue con evidencia de prueba existente en el código, pero su ejecución PostgreSQL para este candidato queda pendiente de un Docker accesible.
- Excepción de fuentes: no se releyeron fuentes primarias fuera del paquete v2; `agents/qa/04_backend_qa.md` se consultó por el riesgo Redis/Testcontainers no cubierto explícitamente. `graphify` inaccesible se registró arriba.

---

## QA independiente — ciclo SEC-BE056-03: retención tras reproceso

### Estado

`PASS`

### Candidato y alcance

- Paquete vigente: `docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v2; handoff previo de Desarrollo: `READY_FOR_HANDOFF`.
- Candidato: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f` + worktree; huella de `git diff HEAD`: `7cd267af7da12c40814ec65da79f9d9cfc3db6f8`.
- Alcance limitado a `JdbcOutboxStore.deleteCompletedBefore` y la regresión PostgreSQL asociada; no se revalidaron controles de autenticación, autorización, tenant o API no afectados.

### Matriz resumida

| Criterio | Implementación | Prueba / evidencia |
|---|---|---|
| DLQ vencida y reprocesada | La purga elimina DLQ vencida solo si su outbox vinculado está `PUBLISHED` o `TERMINAL`; una fila `PENDING` se conserva. | `retentionPreservesReprocessAuditAndLimitForAnOldDlqEventThatWasRequeued`: DLQ >30d → reproceso → purga devuelve 0. PASS con PostgreSQL 17. |
| Reingreso, auditoría y límite | El upsert de reingreso conserva `reprocess_count`; la auditoría V6 es append-only. | La misma prueba realiza dos reingresos adicionales, verifica `reprocess_count = 3`, tres filas de auditoría y rechazo del cuarto reproceso. PASS. |
| Purga de evidencia terminal | CTE elimina primero la DLQ y después la evidencia terminal, sin violar la FK. | `retentionDeletesExpiredDlqBeforeItsTerminalOutboxEvidence`: PASS. |
| Regresión `PUBLISHED` | La condición de borrado de outbox publicado se mantiene en la CTE. | Contraste estático del predicado; sin regresión observada en las 9 pruebas ejecutadas. |

### Comandos y evidencia

- `mvn -s C:\\tmp\\be056-maven-settings.xml "-Dtest=TransactionalOutboxMigrationTest" test`: PASS, 9 pruebas, PostgreSQL 17/Testcontainers y migración Flyway V6.
- Docker/Testcontainers fue ejecutado con acceso escalado al daemon local tras el bloqueo de permisos del sandbox; no hubo excepción funcional de la prueba.
- `git diff --check`: PASS. Huella del diff confirmada: `7cd267af7da12c40814ec65da79f9d9cfc3db6f8`.

### Hallazgos, regresión y riesgos residuales

- Hallazgos abiertos: ninguno.
- Regresión relevante: retención terminal/FK, límite acumulado de tres reprocesos y auditoría tras reingreso pasaron con PostgreSQL real.
- Riesgo residual bajo: no existe aserción dedicada al subcamino de purga `PUBLISHED`; el predicado se conserva y no fue afectado por la condición que protege la fila `PENDING`.

---

## QA independiente — trazabilidad v3

### Estado

`PASS`

### Candidato y alcance

- Paquete vigente: `docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v3; handoff de Desarrollo v3: `READY_FOR_HANDOFF`.
- Candidato fijo: `2ad78920b3b0178d44bc5379d5d1b5c26ff5f131` en `feature/be-056-dlq` (PR #7).
- No hubo cambio funcional posterior a la remediación de Seguridad: los cambios posteriores son trazabilidad, nomenclatura y orquestación. Por ello la evidencia funcional de `d83b166…` se reutiliza para el candidato v3 y la CI se exige sobre el SHA exacto.

### Matriz resumida

| Criterio/riesgo | Implementación | Prueba/evidencia | Resultado |
|---|---|---|---|
| CA-1 a CA-4, VAL-1, tenantId, idempotencia, migración y límites hexagonales | Implementación funcional en el padre `d83b166…`; v3 no cambia código, contratos, pruebas ni migraciones. | `mvn clean verify` local en `d83b166…`: PASS; CI del SHA `2ad7892…` en los flujos EN-010/EN-011: PASS. | PASS |
| SEC-BE056-01 | Autenticación inbound y validación de superadmin/UUID ya remediadas; sin cambio funcional posterior. | Evidencia funcional reutilizada y CI exacta del candidato. | PASS |
| SEC-BE056-02 | Rate limiting distribuido/fail-closed ya remediado; sin cambio funcional posterior. | Evidencia funcional reutilizada y CI exacta del candidato. | PASS |
| SEC-BE056-03 | Auditoría append-only, retención y serialización reproceso/purga ya remediadas; sin cambio funcional posterior. | Evidencia funcional reutilizada y CI exacta del candidato. | PASS |

### Comandos y evidencia

- Reutilizado: `mvn clean verify` en `d83b166…` (padre funcional): PASS.
- CI del candidato exacto `2ad78920b3b0178d44bc5379d5d1b5c26ff5f131`: EN-010 PR #7, ejecución `30931035614`: PASS; EN-011 PR, reejecución `30931035880`: PASS; EN-011 push, ejecución `30931031812`: PASS.
- Verificación documental de esta fase: `git diff --check -- docs/handoffs/backend/BE-056-backend-qa.md`.

### Excepciones, hallazgos y riesgos residuales

- Excepciones: no se releyó ninguna fuente primaria y no se repitieron suites; ambas decisiones se sustentan en el paquete v3, la ausencia de cambio funcional y la CI verificable del mismo candidato.
- Hallazgos: ninguno.
- Regresión relevante: las tres ejecuciones CI PASS sobre el SHA fijo cubren la integración del candidato; el `clean verify` PASS del padre funcional conserva evidencia de la suite completa para el contenido funcional sin cambios.
- Riesgo residual: ninguno nuevo; persisten únicamente los riesgos operativos ya documentados para alertamiento y operación de DLQ.
