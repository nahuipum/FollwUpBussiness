# FE-015 / Routes — Backend QA handoff

**Veredicto:** `PASS`  
**Candidate-ID:** `9e030b7 + FE-014 rutas-ui + FE-015 draft-create-order + cartera-degrada-sugerencias + idem-ambigua + idem-payload + ui-homologada + route-create-max-50 + max-50-cartera-retry + max-selector + app-401-wait + fecha-programada-copy + footer-gap` (working tree).

## Mapeo y evidencia

- `customerName` en respuestas de ruta → `RouteController` enriquece las vistas de lecturas y mutaciones → `RouteControllerTest.returnsAuthorizedCustomerNamesForRoutePointsInOneBatch` verifica JSON y una sola invocación por lote.
- Aislamiento tenant y ausencia de N+1 → `CustomerPortfolioReadService` deduplica IDs y delega `findNameReferences(tenantId, ids)`; `JdbcCustomerStore` selecciona sólo `id,name` con predicado `tenant_id` → `CustomerPortfolioReadServiceTest.resolvesRouteCustomerNamesInOneTenantScopedBatch` verifica lote único y sin lecturas adicionales.
- Límite FE-015 de creación 1..50 → validación de `CreateRouteService` y OpenAPI alineados → `CreateRouteServiceTest` cubre 50 y rechazo de 51 antes de efectos.

## Comandos

- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=CustomerPortfolioReadServiceTest,RouteControllerTest,CreateRouteServiceTest" test` — aprobado.
- `git diff --check` — aprobado.

## Hallazgos y riesgos

Sin hallazgos reproducibles. La consulta de nombres se ejecuta sólo tras la autorización del caso de uso de Routing; no añade PII distinta de `name`, ni migrations, ni acceso cruzado a persistencia. Riesgo residual: un cliente eliminado no produce nombre y el campo queda ausente; no se resuelve con datos de otro tenant.
