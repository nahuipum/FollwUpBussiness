# EN-021 — QA Backend

**Estado:** `PASS`  
**Candidate-ID:** `f31ec28+981fc69ba1af`.

Revalidación focalizada del único hallazgo previo:

- `GET /customers` es alcanzable y aplica sesión → `PortfolioAccessScopeService` → lectura PostgreSQL → filtros → conteo → paginación.
- `CustomerPortfolioReadIntegrationTest` cubre aislamiento A→B/B→A, `COMPANY_ADMIN`/`SUPERVISOR`/`SELLER`, cartera vigente, vendedor inactivo o inexistente y denegaciones seguras.
- Cubre ausencia de actividad, límites de fecha, filtros, conteo/paginación y confirma ausencia de escrituras, auditoría o eventos en consulta.
- El diff no añade PII, campos de respuesta ni contrato público: conecta la ruta existente con alcance previo a cualquier filtro.

Evidencia: pruebas focalizadas de `CustomerControllerTest`, `CustomerPortfolioReadIntegrationTest`, `HexagonalArchitectureTest` y `ModuleBoundaryTest`: `PASS`; `mvn -q clean verify`: `PASS`; `git diff --check`: `PASS`.

Sin hallazgos abiertos. Riesgo residual: los productores de visitas/compras y la materialización de cartera corresponden a sus historias posteriores.
