# BE-019 — QA Backend independiente

**Estado:** `PASS`  
**Candidate-ID:** `7de8183 + 2e06ffdb2ab6`.

Revalidación independiente de QA-01/QA-02 y regresión directa:

- QA-01: `CustomerImportProcessor` exige `docProps/custom.xml` con `TemplateVersion=1.0` y una sola entrada `xl/worksheets/*.xml`. `CustomerImportProcessorTest` cubre XLSX válido, metadato ausente y dos hojas; los inválidos finalizan con `INVALID_TEMPLATE`, sin clientes.
- QA-02: `CustomerImportService` rechaza más de 10 MiB antes de persistir y `CustomerImportController` lo traduce a `413 Payload Too Large`. Pruebas de servicio/controlador verifican ausencia de trabajo y outbox.
- Regresión directa: el listener está incluido en la batería focalizada.

Evidencia inicial: `mvn -q '-Dtest=CustomerImportServiceTest,CustomerImportProcessorTest,CustomerImportControllerTest,CustomerImportRequestedListenerTest' test` y `git diff --check`: PASS.

Revalidación SEC-01/02/03: el listener corta `x-death` antes de procesar y cuarentena envelope inválido; `POST /customer-imports` exige `COMPANY_ADMIN` y `SELLER` recibe 403 en filtro; `ON CONFLICT DO NOTHING` deja un trabajo/un outbox para dos solicitudes idénticas y 409 para contenido distinto. `mvn -q '-Dtest=CustomerImportRequestedListenerTest,CustomerImportServiceTest,SecurityConfigurationTest' test`: PASS (41 pruebas); `git diff --check`: PASS.

No hay hallazgos reproducibles. Riesgo residual: no se reprodujo RabbitMQ real; no afecta las correcciones revalidadas.

Revalidación final SEC-01: excepciones de processor/store/audit pasan a retry TTL 1 s; la cuarta marca `FAILED`, audita, incrementa métrica y publica una sola vez a DLQ. `default-requeue-rejected=false` está configurado; envelope inválido conserva DLQ inmediata. `mvn -q '-Dtest=CustomerImportRequestedListenerTest' test` y `git diff --check`: PASS. Riesgo residual: falta broker RabbitMQ real.

Validación final real: `CustomerImportProcessorTransactionIntegrationTest` (PostgreSQL) confirmó rollback post-claim a `PENDING`; `CustomerImportRabbitMqIntegrationTest` confirmó tres retry TTL, cuarta `FAILED`, auditoría/métrica y una DLQ. Comando focal PASS con Testcontainers.
