# EN-021 — Handoff de Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `f31ec28+981fc69ba1af`

## Alcance entregado

Se conectó exclusivamente `GET /customers` existente: actor de sesión → alcance de cartera vigente → filtros → conteo SQL → paginación. No acepta tenant de entrada, no escribe, no emite eventos/auditoría y conserva la respuesta contractual existente sin campos PII, IDs/totales adicionales ni logs.

- Wiring REST y respuesta paginada: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/adapter/in/rest/CustomerController.java`.
- Caso de lectura, almacén PostgreSQL y alcance Workforce: `.../customers/application/CustomerPortfolioReadService.java`, `.../customers/adapter/out/persistence/JdbcCustomerPortfolioStore.java`, `.../workforce/application/PortfolioAccessScopeService.java`.
- Se reutilizan las migraciones forward-only V29/V30; sin migraciones ni contrato público nuevos.

## Evidencia

`mvn -q -Dtest=CustomerControllerTest,CustomerPortfolioReadIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest test` — PASS. Cubre Admin/Supervisor/Seller; A→B y B→A; vendedor inactivo/inexistente; ausencia y fecha inclusiva; conteo/paginación y ausencia de escrituras.

`mvn -q clean verify` — PASS (ejecución completa local posterior, 223 s). `git diff --check` — PASS.

Riesgo residual: ninguno funcional identificado. Reproducción: ejecutar el comando focalizado anterior desde `backend/followupbussiness` con Docker disponible.
