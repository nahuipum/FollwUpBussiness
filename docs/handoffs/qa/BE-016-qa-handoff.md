# BE-016 — QA backend independiente

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 055bab6 + BE-016 customer-list UTC-cutoff`.

## Mapeo y evidencia

- Alcance: `JdbcCustomerPortfolioStore` impone `tenant_id` y cartera antes de filtros, conteo y paginación; `CustomerPortfolioReadService` rechaza `sellerId` ajeno para supervisor/vendedor. `CustomerPortfolioReadIntegrationTest` cubre roles, cruce de tenant, vendedor inactivo/desconocido, actividad ausente, límite UTC, página y cero escrituras.
- Filtros/HTTP: `CustomerControllerTest` cubre contrato de página, `sellerId`, `400` sin puertos de lectura y `403` genérico. Territorio, búsqueda, estado, segmento y fechas sólo estrechan el predicado ya acotado.
- UTC: `< 00:00Z` y prueba de actividad exactamente en el límite verifican la semántica requerida.

## Comandos

- `mvn -q '-Dtest=CustomerPortfolioReadIntegrationTest,CustomerControllerTest' test`: PASS (QA inicial).
- `mvn -q clean verify`: PASS reutilizado del handoff de Development para este Candidate-ID.
- `git diff --check`: PASS en la revalidación; cierre del hallazgo de formato.

No se reejecutaron pruebas funcionales: la remediación sólo eliminó whitespace final en artefactos. Riesgo de regresión directo: no observado. Residual: matriz HTTP completa de filtros inválidos/incompatibles no ejecutada, sin cambio de superficie.
