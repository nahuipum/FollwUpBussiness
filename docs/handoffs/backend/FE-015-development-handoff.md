# FE-015 / Routes — Backend development handoff

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `9e030b7 + route-customer-names-batch` (working tree, sin commit).

## Alcance entregado

- Las respuestas `Route` de `GET /routes`, `GET /routes/{routeId}`, `GET /routes/my-route` y mutaciones que devuelven la ruta incluyen `points[].customerName`, campo ya admitido por OpenAPI.
- `RouteController` obtiene los nombres sólo después de que el caso de uso de Routing autoriza la ruta. Envía los IDs distintos de todos los puntos de la respuesta en una única consulta por lote, acotada por `tenantId`; no accede a repositorios de Clientes desde Routing ni ejecuta una consulta por punto.
- El puerto existente `CustomerPortfolioReadUseCase` expone una proyección mínima de nombre para puntos ya autorizados. Persistencia selecciona exclusivamente `id,name`; no se agregan PII, autorizaciones, migraciones ni cambios de contrato.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/adapter/in/rest/RouteController.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/application/port/in/CustomerPortfolioReadUseCase.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/application/CustomerPortfolioReadService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/application/port/out/CustomerStore.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/adapter/out/persistence/JdbcCustomerStore.java`
- Pruebas: `CustomerPortfolioReadServiceTest.java`, `routing/adapter/in/rest/RouteControllerTest.java`.

## Verificación

- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=CustomerPortfolioReadServiceTest,RouteControllerTest' test` — aprobado (compila 134 pruebas; las 4 focales pasan).
- `git diff --check` — aprobado.

## Criterios y reproducción

- Ruta autorizada con dos puntos devuelve sus dos `customerName`; la prueba REST comprueba el JSON y que hay una única llamada por lote.
- El servicio elimina IDs repetidos y delega una única lectura tenant-scoped; no usa `get` por punto.
- Sin migración ni modificación de OpenAPI: `customerName` ya era opcional en `RoutePoint`.

Riesgo residual: si un cliente histórico ya no existe, `customerName` queda ausente conforme al campo opcional; no se sustituye por datos de otro tenant.
