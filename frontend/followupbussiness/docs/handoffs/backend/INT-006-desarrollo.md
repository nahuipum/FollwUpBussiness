# INT-006 — Desarrollo Backend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `01589d3 + dcdce259805f` (delta posterior solo Frontend INT-006-FE-01).

El E2E confirmó aceptación parcial correcta con datos únicos. Luego reveló `500` al consultar como tenant B un trabajo de A. La causa era una excepción de autorización de creación reutilizada por la lectura, que GET no traducía. Se corrigió para emitir la excepción de lectura y responder `403`; el filtro tenant-scoped conserva `404` para B sobre A.

Control → prueba: aceptación parcial PostgreSQL/PostGIS real → `CustomerImportProcessorPersistenceIntegrationTest`; tenant B sin recurso y actor sin rol → `CustomerImportServiceTest` y `CustomerImportControllerTest`.

Validación: pruebas focalizadas PASS, `mvn clean verify` PASS y `git diff --check` PASS. Sin cambios de contrato, mensajería, migraciones ni configuración.

Revalidación E2E posterior al reinicio: tenant B recibe `404` para resultado y errores de A. Listo para QA independiente.
