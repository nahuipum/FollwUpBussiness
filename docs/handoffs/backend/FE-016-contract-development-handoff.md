# FE-016 — Handoff Development Backend

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `b6d8d35 + ac4bee151f2b`.

## Alcance

`POST /routes/optimize` valida el territorio derivado dentro del tenant antes
de cuota, matriz y persistencia. Si está inactivo, responde `422`
`VISIT_TERRITORY_INACTIVE`, sin IDs ni datos sensibles. La asignación ausente
mantiene `422 VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER`; ruta, cartera, tenant,
rol y alcance conservan `403`.

## Archivos, contrato y migraciones

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/application/{SellerReferenceService.java,port/in/SellerReferenceUseCase.java}`.
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/{application/OptimizeRouteService.java,adapter/in/rest/RouteOptimizationController.java}`.
- Pruebas: `OptimizeRouteServiceTest.java`, `RouteOptimizationControllerTest.java`, `JdbcMatrixQuotaIntegrationTest.java` y nuevo `SellerReferenceServiceTest.java`.
- `docs/api/openapi.yaml` y `docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md`; sin migraciones.

## Evidencia

- `git diff --check`: PASS.
- Pruebas focalizadas: PASS con `mvn -q -Dmaven.repo.local=C:\Users\LUIS\.m2\repository -Dtest=OptimizeRouteServiceTest,RouteOptimizationControllerTest,SellerReferenceServiceTest,RoutingConfigurationTest,MapboxMatrixAdapterTest,HexagonalArchitectureTest,ModuleBoundaryTest test`.
- Validación local CI-equivalente: PASS con `mvn -q clean verify -Dmaven.repo.local=C:\Users\LUIS\.m2\repository` (139 reportes Surefire, 0 fallos y 0 errores).
- Cobertura añadida: zona inactiva pese a asignación, ausencia de cuota/matriz/persistencia, 422 seguro y semántica Workforce.

Reproducir: asignar vendedor a una zona, inactivarla y optimizar un `DRAFT` autorizado; debe responder `422 VISIT_TERRITORY_INACTIVE` sin cuota, proveedor ni escritura.
