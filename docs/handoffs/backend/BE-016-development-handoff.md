# BE-016 — Desarrollo backend

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `HEAD 055bab6 + BE-016 customer-list UTC-cutoff`.

## Alcance y cambios

`GET /customers` queda cubierto por la implementación hexagonal existente: identidad/tenant de sesión, alcance vigente de admin/supervisor/seller, consulta y conteo con tenant/cartera previos a filtros/paginación, orden `name,id`, respuestas `200/400/403` y `correlationId`.

Se corrigió el borde UTC de `withoutVisitSince` y `withoutPurchaseSince`: incluye ausencia de actividad y hechos estrictamente anteriores a `00:00:00Z` de la fecha solicitada. No hay escrituras, auditoría ni eventos.

Archivos modificados:

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/adapter/out/persistence/JdbcCustomerPortfolioStore.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/customers/persistence/CustomerPortfolioReadIntegrationTest.java`

## Contratos, migraciones y evidencia

No se modificaron OpenAPI ni migraciones. Se consultó el fragmento de `docs/api/openapi.yaml` únicamente para resolver la ambigüedad del límite temporal; aplica anterior a medianoche UTC.

- `mvn -q '-Dtest=CustomerPortfolioReadIntegrationTest,CustomerControllerTest' test`: PASS.
- `mvn -q clean verify`: PASS (incluye migraciones, integración PostgreSQL/Testcontainers y arquitectura).
- `git diff --check`: PASS.

Remediación QA: se eliminaron las líneas en blanco finales de este handoff y del paquete de contexto; cambio exclusivo de formato, sin recalcular el Candidate-ID.

Cobertura: aislamiento por tenant/cartera, roles admin/supervisor/seller, rechazo de seller ajeno/inactivo/desconocido, actividad ausente y borde UTC, paginación y lectura sin escrituras. Riesgo residual: QA/Security deben reproducir manipulación de `sellerId`/`territoryId` ajenos en el candidato calculado. No hay trabajo de Development pendiente.
