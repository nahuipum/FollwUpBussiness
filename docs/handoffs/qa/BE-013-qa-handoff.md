# BE-013 — Handoff QA

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 5702c0a + BE-013 customers/V28/PostGIS/REST/auditoría-atómica`.

## Mapeo y evidencia

- **Atomicidad ante fallo de commit:** `CustomerConfiguration` inyecta el mismo `JdbcTemplate` en `JdbcCustomerStore` y `JdbcAuditEntryStore`; `CustomerCreationTransactionIntegrationTest#rollsBackCustomerAndAuditWhenCommitFailsAfterAuditWasWritten` fuerza una FK diferida tras auditar y comprueba cero `customer` y cero auditorías `CUSTOMER/SUCCESS`.
- **Creación directa y geodato:** servicio/controlador y prueba de integración conservan creación solo por `COMPANY_ADMIN`, `tenantId` del actor y PostGIS SRID 4326.
- **Denegación sin efectos:** `CreateCustomerServiceTest` cubre `SELLER` y territorio ajeno/inactivo sin inserción ni auditoría; `CustomerControllerTest` verifica 403 y que el cuerpo no admita `tenantId`.

**Comando/evidencia:** `mvn -q "-Dtest=CreateCustomerServiceTest,CustomerControllerTest,CustomerCreationTransactionIntegrationTest" test` → PASS (Flyway V28 + PostGIS/Testcontainers). `git rev-parse --short HEAD` → `5702c0a`; árbol con cambios BE-013 esperados y `git diff --check` sin hallazgos.

## Hallazgos y riesgos

El hallazgo alto anterior queda cerrado; no hay hallazgos reproducibles en esta revalidación. Riesgo residual: `mvn -q clean verify` previo no concluyó por timeout, por lo que no se reclama validación completa; la regresión focalizada sí es PASS. No se abrieron fuentes primarias: no hubo ambigüedad, contradicción ni riesgo nuevo.
