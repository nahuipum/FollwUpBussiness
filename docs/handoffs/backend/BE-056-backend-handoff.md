# BE-056 — Backend handoff

## Estado

`READY_FOR_HANDOFF`

## Alcance entregado

- DLQ durable PostgreSQL para fallos de publicación outbox, con transición atómica `CLAIMED → TERMINAL + transactional_outbox_dlq`.
- Clasificación: `IllegalArgumentException` (envelope/payload inválido) es permanente; el resto de fallos de transporte se reintenta hasta ocho intentos y luego ingresa a DLQ.
- Reproceso explícito por `eventId`, máximo tres veces, con actor técnico y fecha; la fila durable determina tenant, correlación y payload, sin recibir tenant del cliente.
- Barrera HTTP interna `POST /internal/outbox/dlq/{eventId}/reprocess`: `SecurityFilterChain` exige `PLATFORM_SUPERADMIN`; el controlador vuelve a validar la autoridad y deriva el UUID del operador desde `Authentication`.
- Métricas: gauges `outbox.dlq.depth` y `outbox.dlq.oldest_age_seconds`; contador de reprocesos `outbox.dlq.reprocessed`. Las entradas DLQ continúan siendo contadas por `outbox.events.terminal`.

## Archivos

- Migración: `backend/followupbussiness/src/main/resources/db/migration/V6__create_transactional_outbox_dlq.sql`.
- Persistencia y transición: `.../outbox/adapter/out/persistence/JdbcOutboxStore.java`.
- Política/caso de uso: `.../outbox/application/OutboxPublisher.java`, `ReprocessOutboxEvent.java`, `PlatformOperator.java` y `PublicationFailureKind.java`.
- Entrada autorizada: `.../outbox/adapter/in/rest/DlqReprocessController.java` y `.../identityaccess/config/SecurityConfiguration.java`.
- Observabilidad: `.../outbox/config/OutboxConfiguration.java`.

## Contratos y migraciones

- ADR aplicado: `docs/architecture/adr/ADR-019-dlq-durable-publicacion-outbox.md`.
- No se modificó el contrato de eventos ni la topología RabbitMQ; DLQ de consumidores queda fuera de alcance.
- V4 conserva `eventId`, tenant, correlationId, causationId, envelope controlado, motivo saneado y metadatos de reproceso; la retención existente purga evidencia tras 30 días.

## Verificación

- `mvn -s C:\tmp\be056-maven-settings.xml -Dtest=OutboxPublisherTest,TransactionalOutboxMigrationTest,OutboxPublishingSchedulerTest,HexagonalArchitectureTest,ModuleBoundaryTest test` con JDK 21: PASS, 16 pruebas.
- `git diff --check`: PASS.
- `python -m graphify update .`: PASS; reportó que SQL no se extrae por ausencia de `tree_sitter_sql` (no afecta el código ni pruebas).

## Criterios cubiertos y reproducción

- Reintentos limitados: prueba de fallo transitorio y octavo intento en `OutboxPublisherTest`.
- Permanentes a DLQ, atomicidad, migración y tope de reprocesos: `TransactionalOutboxMigrationTest` con PostgreSQL Testcontainers.
- CorrelationId: preservado por la copia SQL desde outbox y por el envelope existente.
- Métrica/alerta: gauges/contadores registrados en `OutboxConfiguration`; alerta queda a cargo de la configuración operativa de Prometheus.
- Reproducción: insertar/emitir un evento outbox con payload inválido o agotar ocho fallos de confirmación; comprobar fila `TERMINAL` y fila DLQ con el mismo `event_id`; invocar el endpoint autenticado como `PLATFORM_SUPERADMIN` tres veces como máximo.

## Riesgos residuales

- La autenticación runtime (emisión de `Authentication` con UUID/autoridad) pertenece al flujo de identidad existente; el endpoint rechaza ausencia de autoridad o identidad no UUID.
- La alerta concreta debe configurarse en la plataforma de observabilidad sobre profundidad/antigüedad y contadores; no se registran payloads ni PII.

## Corrección posterior a revisión de Desarrollo

- Retención corregida: una CTE elimina primero la DLQ y después la evidencia terminal de outbox, en la misma sentencia, evitando violar la FK de V4.
- `ReturnedMessage` de RabbitMQ ahora produce `UnroutablePublicationException`, clasificada como permanente y enviada inmediatamente a DLQ.
- Endpoint alineado al servidor OpenAPI: `POST /api/v1/internal/outbox/dlq/{eventId}/reprocess`; prueba real cubre anónimo, ausencia de autoridad, identidad no UUID y superadmin válido sin tenant de cliente.
- Pruebas dirigidas posteriores: `RabbitMqEventTransportTest`, `TransactionalOutboxMigrationTest` y `SecurityConfigurationTest`: PASS, 40 pruebas con JDK 21.

## Corrección posterior a QA

- La transición a DLQ usa `ON CONFLICT (event_id) DO UPDATE`: un nuevo fallo tras reproceso refresca la evidencia de fallo/envelope y conserva `reprocess_count`, `last_reprocessed_by` y `last_reprocessed_at`.
- `TransactionalOutboxMigrationTest.keepsReprocessAuditWhenAnEventReturnsToDlqAfterReprocessing` valida PostgreSQL real para mover → reprocesar → mover de nuevo; la retención con FK se mantiene cubierta.
- Prueba dirigida posterior: `TransactionalOutboxMigrationTest`: PASS, 8 pruebas con JDK 21.

## QA independiente — BE-056

### Estado

`PASS`

### Snapshot revisado

- Rama: `feature/be-056-dlq`.
- Alcance: diff sin commit frente a `HEAD dca1a9c` (BE-056, 16 archivos modificados y los nuevos archivos listados en este handoff).

### Matriz resumida

| Criterio/riesgo | Implementación revisada | Evidencia independiente |
|---|---|---|
| CA1, retry/backoff y lease | Límite de ocho, backoff con jitter, `FOR UPDATE SKIP LOCKED` y lease vencible. | `OutboxPublisherTest`, `OutboxPublishingSchedulerTest` y prueba PostgreSQL: PASS. |
| CA2, permanentes y DLQ atómica | Clasificación de envelope inválido/no enrutable; CTE `CLAIMED → TERMINAL + DLQ`; upsert preserva auditoría al reingresar. | `RabbitMqEventTransportTest` y `TransactionalOutboxMigrationTest`: PASS; el ciclo mover → reprocesar → mover y el máximo de tres acciones se ejecutaron con PostgreSQL 17 Testcontainers. |
| CA3, correlationId y tenant | Envelope, cabeceras y copia durable preservan IDs; endpoint no recibe tenant ni cuerpo. | `RabbitMqEventTransportTest` y `SecurityConfigurationTest`: PASS. |
| CA4, métricas/alertas | Gauges DLQ, contador de reprocesos y alertas de profundidad/antigüedad. | Regla Prometheus validada por `promtool`: 6 reglas; pruebas dirigidas PASS. |
| Retención/FK | CTE elimina DLQ antes de la evidencia terminal outbox en la misma sentencia. | `retentionDeletesExpiredDlqBeforeItsTerminalOutboxEvidence` ejecutada con PostgreSQL Testcontainers: PASS. |
| Seguridad y arquitectura | Rol `PLATFORM_SUPERADMIN`, UUID autenticado, 401/403; límites hexagonales y de módulos. | `SecurityConfigurationTest`, `HexagonalArchitectureTest`, `ModuleBoundaryTest`: PASS. |

### Comandos y resultados

- `mvn -s C:\\tmp\\be056-maven-settings.xml "-Dtest=OutboxPublisherTest,TransactionalOutboxMigrationTest,OutboxPublishingSchedulerTest,RabbitMqEventTransportTest,SecurityConfigurationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` con JDK 21: PASS, 51 pruebas.
- `mvn -s C:\\tmp\\be056-maven-settings.xml "-Dtest=TransactionalOutboxMigrationTest" test` con JDK 21/PostgreSQL 17 Testcontainers: PASS, 8 pruebas.
- `docker run --rm --entrypoint /bin/promtool ... check rules /rules/followupbussiness-outbox-alerts.yaml`: PASS, 6 reglas.
- `git diff --check`: PASS.

### Hallazgos y riesgos residuales

- Sin hallazgos abiertos. La anterior colisión de PK tras reproceso queda cubierta por el upsert y su prueba PostgreSQL real.
- Riesgo residual: la operación conserva evidencia DLQ y la métrica de profundidad hasta la retención; es consistente con la decisión de auditoría y el límite de tres reprocesos, pero requiere operación consciente de las alertas.

## Desarrollo — validación actual (paquete v2)

### Estado

`READY_FOR_HANDOFF`

### Candidato y alcance

- Paquete: `docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v2.
- Candidato fijado: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f` + worktree, SHA-1 de `git diff HEAD` `c653ae823b961ba82389f6bce1891f12bf6f9141`.
- Esta fase añadió únicamente la aserción de frontera de `VAL-1` en `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfigurationTest.java`: el UUID del principal autenticado se entrega como `PlatformOperator` al caso de uso.

### Evidencia actual

- `mvn -Dtest=SecurityConfigurationTest,OutboxPublisherTest test`: PASS, 36 pruebas. Cubre anónimo (401), sin rol (403), identidad no UUID (403) y superadmin válido (202), además de la identidad UUID exacta propagada al caso de uso.
- `mvn -Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test`: PASS, 4 pruebas.
- `git diff --check`: PASS.
- El endpoint no declara `@RequestBody` ni `tenantId`; `SecurityConfiguration` exige `PLATFORM_SUPERADMIN` y `DlqReprocessController` valida de nuevo la autoridad y convierte `Authentication.getName()` a UUID.

### Excepción y riesgo residual

- `mvn -Dtest=SecurityConfigurationTest,OutboxPublisherTest,TransactionalOutboxMigrationTest test`: la migración no se ejecutó porque Testcontainers no encontró un entorno Docker. Reproducción: ejecutar el mismo comando con Docker disponible. No se atribuye este bloqueo al código; las pruebas no dependientes de Docker pasaron.
- Excepción de fuentes: ninguna fuente primaria se releyó fuera del paquete v2. `graphify` no pudo ejecutarse/actualizarse por un intérprete instalado no accesible; no altera la evidencia de código y pruebas.

## Desarrollo — remediación de Seguridad (SEC-BE056-01/02/03)

### Estado

`READY_FOR_HANDOFF`

### Candidato y alcance

- Base: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f`; diff actual `git diff HEAD | git hash-object --stdin`: `6e9b87a44294f4b889796794f395b260b423c976`.
- `SEC-BE056-01`: `InboundJwtAuthenticationFilter` exige Bearer para el reproceso y `InboundJwtAuthenticator` valida RS256, `iss`, `aud`, expiración, `sub`/`sid` UUID, único rol `PLATFORM_SUPERADMIN`, ausencia de tenant y sesión/cuenta/rol activos en PostgreSQL. El controlador conserva la validación defensiva del UUID y rol.
- `SEC-BE056-02`: límite distribuido y fail-closed Redis de 20 solicitudes/minuto por operador y 60/minuto por origen remoto, con claves HMAC sin identidad/origen en claro, `429` y `Retry-After`; indisponibilidad devuelve `503`.
- `SEC-BE056-03`: V6 añade `transactional_outbox_dlq_reprocess_audit` append-only (`event_id`, operador, instante y resultado), insertado en la misma operación SQL que reencola. La FK usa borrado en cascada al expirar la evidencia DLQ a 30 días.

### Archivos, contratos y migración

- Auth runtime: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticator.java`, `InboundJwtAuthenticationFilter.java`, `identityaccess/config/LoginConfiguration.java` y `SecurityConfiguration.java`.
- Throttle: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/outbox/adapter/in/rest/DlqReprocessRateLimiter.java`, `DlqReprocessController.java` y `outbox/config/OutboxConfiguration.java`.
- Auditoría: `outbox/adapter/out/persistence/JdbcOutboxStore.java` y `src/main/resources/db/migration/V6__create_transactional_outbox_dlq.sql`.
- No cambia OpenAPI ni el contrato de eventos: la ruta, ausencia de body/tenant y respuestas del paquete v2 se mantienen.

### Verificación y criterios

- `mvn -s C:\tmp\be056-maven-settings.xml "-Dtest=SecurityConfigurationTest,InboundJwtAuthenticatorTest,DlqReprocessRateLimiterTest,OutboxPublisherTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 44 pruebas.
- `git diff --check`: PASS.
- Cubre token firmado/modificado, sesión/rol persistido, `sub` UUID, tenant/rol no admisibles, 401/403, 429 por abuso, límites arquitectónicos y la integración del caso de uso existente.
- La prueba PostgreSQL de la migración/auditoría es `TransactionalOutboxMigrationTest.reprocessesDlqOnlyForPlatformOperatorAndAtMostThreeTimes`; ahora comprueba tres filas append-only y tres operadores. No se ejecutó en este entorno: Docker/Testcontainers no disponible. Reproducción: con Docker, ejecutar `mvn -s C:\tmp\be056-maven-settings.xml "-Dtest=TransactionalOutboxMigrationTest" test`.

### Riesgos y excepciones

- Riesgo residual: la evidencia de la migración V6/auditoría requiere la ejecución PostgreSQL indicada; la compilación y las pruebas sin Docker sí pasaron.
- Excepción de fuentes: no se releyeron fuentes primarias fuera del paquete v2. `graphify` sigue inaccesible por el intérprete Python del entorno; no se usó para inferir reglas.

## Desarrollo — remediación SEC-BE056-03: retención tras reproceso

### Estado

`READY_FOR_HANDOFF`

### Candidato y alcance

- Base: `HEAD 36787e83110420e95cf7054964b1dc3e9081bf6f`; diff actual `git diff HEAD | git hash-object --stdin`: `7cd267af7da12c40814ec65da79f9d9cfc3db6f8`.
- Se modifica solo `JdbcOutboxStore.deleteCompletedBefore`: una DLQ vencida se purga únicamente si su evidencia outbox vinculada continúa en estado `PUBLISHED` o `TERMINAL`. Una fila en `PENDING` tras reproceso queda retenida, por lo que la FK no elimina el historial append-only ni reinicia `reprocess_count` antes de que el nuevo fallo haga el upsert.
- No cambia migración, contrato REST/eventos, tenant ni autorización. El límite acumulado de tres sigue aplicado por `reprocess_count < 3`.

### Archivos, prueba y criterios

- Código: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/outbox/adapter/out/persistence/JdbcOutboxStore.java`.
- Regresión: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/outbox/persistence/TransactionalOutboxMigrationTest.java`, `retentionPreservesReprocessAuditAndLimitForAnOldDlqEventThatWasRequeued`.
- La prueba reproduce: DLQ con antigüedad mayor de 30 días → reproceso → purga → reingreso a DLQ; comprueba que las tres acciones permitidas conservan `reprocess_count = 3` y tres filas de auditoría, y que la cuarta es rechazada.

### Verificación y excepciones

- `mvn -s C:\tmp\be056-maven-settings.xml -Dtest=TransactionalOutboxMigrationTest test`: no ejecutó la clase por ausencia de Docker accesible a Testcontainers (`\\.\pipe\docker_engine`); no es fallo de aserción ni de código.
- Alternativa local: Maven alcanzó compilación/Surefire con las dependencias resueltas; no hubo ejecución PostgreSQL. Un intento de reconstrucción limpia quedó impedido porque el repositorio compartido `C:\tmp\be056-m2` no permite crear el descriptor de `maven-clean-plugin`.
- `git diff --check`: PASS.
- Reproducción pendiente con Docker disponible: ejecutar el primer comando y verificar la nueva prueba PostgreSQL; después Security debe revalidar SEC-BE056-03 sobre el candidato indicado.

### Riesgo residual

- La semántica SQL nueva requiere ejecución real PostgreSQL/Testcontainers para cerrar la evidencia de integración. No se alteraron otros hallazgos de Seguridad ni reglas del paquete v2.

## Remediación SEC-BE056-03 — 2026-08-04

### Estado

`READY_FOR_HANDOFF`

### Alcance y cambios

- `JdbcOutboxStore.reprocessFromDlq` toma un bloqueo transaccional advisory determinista por `event_id` antes de revalidar DLQ, límite de reprocesos y estado `TERMINAL`; la actualización y el registro append-only permanecen en la misma sentencia.
- `JdbcOutboxStore.deleteCompletedBefore` toma el mismo bloqueo por cada DLQ candidata, en orden determinista, y vuelve a validar estado y fechas tras el bloqueo. La evidencia DLQ/auditoría no se purga si el evento fue publicado recientemente, aunque `entered_at` sea anterior al corte.
- `TransactionalOutboxMigrationTest` añade cobertura PostgreSQL para la carrera reproceso/purga y para la publicación reciente; confirma contador y auditoría.

### Contratos y migraciones

- Sin cambios de contrato público, puerto ni migración. Se conserva `V6__create_transactional_outbox_dlq.sql` y su tabla de auditoría append-only.

### Verificación

- `mvn -Dtest=TransactionalOutboxMigrationTest test`: PASS, 11 pruebas, PostgreSQL 17 mediante Testcontainers/Docker.
- `git diff --check`: PASS.
- `python -m graphify update .`: PASS; actualización AST local. Avisos no bloqueantes: fuentes no estructurables y ausencia de `tree_sitter_sql` para SQL.

### Criterios y reproducción

- Cubiertos: exclusión mutua por evento entre reproceso y purga, revalidación posterior al lock, conservación de contador/auditoría y retención desde publicación/terminalización efectiva.
- Reproducir: desde `backend/followupbussiness`, ejecutar `mvn -Dtest=TransactionalOutboxMigrationTest test`; la prueba `serializesConcurrentReprocessAndRetentionForTheSameOldDlqEvent` bloquea temporalmente el mismo advisory lock y verifica que reproceso gana, purga devuelve cero y permanece la auditoría.

### Riesgos

- El advisory lock usa el hash PostgreSQL del UUID; una colisión solo serializa eventos independientes y no altera datos. Los hallazgos SEC-BE056-01 y SEC-BE056-02 permanecen fuera de este alcance.
