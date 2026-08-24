# BE-019 — Paquete de contexto

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `7de8183 + 2e06ffdb2ab6 (working tree)`.  
**Fase siguiente:** QA de remediación SEC-01 RabbitMQ.

## Alcance vigente

- `POST /customer-imports`: solo `COMPANY_ADMIN`; tenant/solicitante de sesión. CSV UTF-8 y XLSX OOXML: 10 MiB, una hoja, 10 000 filas, 512 caracteres por celda, compresión 20:1 y `TemplateVersion=1.0`.
- Idempotencia tenant/solicitante/ruta/versión/modo/SHA-256; creación y outbox transaccionales; evento mínimo sin PII; retención: archivo 24 h y resultados 30 días.

## Delta SEC-01 final

- `CustomerImportProcessor` ahora es proxyable; una excepción posterior a `claim()` hace rollback y evita el estado `PROCESSING` huérfano.
- Los reintentos no dependen exclusivamente de `x-death`: RabbitMQ reinicia ese contador al republicar el mismo mensaje. El listener conserva el conteo técnico de entrega al enviar a `customer-import.retry.v1` (TTL 1 s), sin hot requeue.
- En cuarta entrega: `FAILED`, auditoría sin PII, métrica `customer_imports.failed` y exactamente una publicación en `customer-import.dlq.v1`.

## Evidencia y foco QA

- PASS: focalizada `CustomerImportProcessorTest`, `CustomerImportProcessorTransactionIntegrationTest`, `CustomerImportRequestedListenerTest` y `CustomerImportRabbitMqIntegrationTest`; estas últimas usan PostgreSQL y RabbitMQ reales con Testcontainers.
- PASS: `mvn -q clean verify`; `git diff --check`.
- Revalidar: excepción post-claim deja `PENDING`; tres pasos TTL y la cuarta entrega produce una sola DLQ, `FAILED`, auditoría y métrica. SEC-02/SEC-03 no cambian.
- Sin contrato ni migración nueva. Riesgo residual: el contador técnico de entrega requiere que la ruta interna de outbox permanezca restringida a productores confiables.
