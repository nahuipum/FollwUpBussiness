# BE-019 — Remediación final Backend SEC-01

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `7de8183 + 2e06ffdb2ab6 (working tree)`.

Alcance SEC-01: `CustomerImportProcessor` deja de ser `final`, por lo que sus límites `@Transactional` son proxyables. Un fallo posterior a `claim()` revierte `PROCESSING` a `PENDING`. El listener mantiene un contador técnico de entregas al reenviar a `customer-import.retry.v1`: RabbitMQ reemplaza el conteo `x-death` al republicar el mismo mensaje, por lo que el contador permite cerrar de forma determinista en la cuarta entrega. No hay hot requeue: cada reintento pasa por TTL; la cuarta marca `FAILED`, audita, incrementa `customer_imports.failed` y publica un único mensaje a DLQ.

Archivos: `imports/application/CustomerImportProcessor.java`, `imports/adapter/in/messaging/CustomerImportRequestedListener.java`; pruebas `CustomerImportProcessorTransactionIntegrationTest.java` y `CustomerImportRabbitMqIntegrationTest.java`.

Contratos/migraciones: sin cambios nuevos; se conserva `V38__create_customer_imports.sql` y las colas existentes.

Validación: `mvn -q '-Dtest=CustomerImportProcessorTest,CustomerImportProcessorTransactionIntegrationTest,CustomerImportRequestedListenerTest,CustomerImportRabbitMqIntegrationTest' test` PASS; RabbitMQ/PostgreSQL reales mediante Testcontainers; `mvn -q clean verify` PASS; `git diff --check` PASS.

Cobertura: rollback post-claim sin `PROCESSING` huérfano; tres reintentos TTL espaciados; cuarta entrega `FAILED` + auditoría + métrica + una DLQ; envelope inválido continúa en DLQ inmediata. Riesgo residual: el header técnico de entrega presupone que productores no confiables no pueden publicar en la ruta interna; ya aplica la misma confianza requerida para el envelope de outbox.
