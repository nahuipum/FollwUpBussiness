# BE-022 — Handoff Development

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `db27cc3+4ec4aabeae61` (recalculado sobre el diff vigente; los archivos nuevos siguen sin indexar).

## Alcance

Remediada la evidencia solicitada para optimización: cálculo por prioridad conservando índices originales de matriz asimétrica, totales de viaje/distancia/servicio y propuesta `published=false`. Se validan entradas inválidas como `Invalid`, incluida prioridad `<= 0`; los fallos de Matrix son `Unavailable`; rol y alcance del supervisor se rechazan antes de Matrix. Las visitas no asignadas distinguen `TIME_WINDOW_CONFLICT` de `OUTSIDE_SHIFT`.

Seguridad: la ruta debe pertenecer al vendedor y fecha del comando antes de reservar cuota/Matrix. Se añade el puerto neutral `MatrixQuota` y reserva PostgreSQL atómica de máximo 35 matrices por tenant/cuenta/día antes del proveedor; en composición usa `REQUIRES_NEW`, por lo que queda durable aun cuando Matrix, solver o propuesta fallen. El exceso retorna `503` con `PROVIDER_RATE_LIMITED`, sin IDs en respuesta, logs ni métricas.

La integración PostgreSQL demuestra dos transacciones simultáneas con `CyclicBarrier`, advisory lock y persistencia de versiones 1/2. La prueba descubrió y corrigió dos defectos reales en `JdbcRouteProposalStore`: lectura del retorno `void` de `pg_advisory_xact_lock` y un placeholder SQL excedente en `save`.

## Archivos, contrato y migración

- Producción: `routing/application/OptimizeRouteService.java`; `routing/adapter/out/persistence/JdbcRouteProposalStore.java`, `JdbcMatrixQuota.java`; `routing/config/RoutingConfiguration.java`.
- Pruebas: `routing/application/OptimizeRouteServiceTest.java`, `routing/adapter/in/rest/RouteOptimizationControllerTest.java`, `routing/persistence/JdbcRouteProposalStoreConcurrencyTest.java`, `JdbcMatrixQuotaIntegrationTest.java`.
- Migraciones: se reutiliza `V43` y se añade `V44__create_route_matrix_quota.sql`; sin cambio OpenAPI.

## Evidencia

- `mvn -q -Dtest=JdbcMatrixQuotaIntegrationTest,OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest test` — PASS.
- `mvn -q clean verify` — PASS.
- `git diff --check` — PASS.

## Criterios cubiertos y reproducción

Matriz asimétrica vía `optimize` verifica orden, arcos y totales; rol/scope, vendedor y fecha de ruta verifican `verifyNoInteractions(Matrix)`; prioridad no positiva queda en `Invalid`; cuota agotada devuelve `RateLimited` sin Matrix/persistencia y el controlador retorna el código seguro. Testcontainers/Flyway verifica que 35 fallos de Matrix dentro de transacciones exteriores consumen cuota durable y que la llamada 36 no alcanza Matrix ni propuesta.

Riesgo residual: Mapbox/OR-Tools productivos no están provisionados; el puerto sigue fail-closed. Para reproducir, ejecutar el comando focal anterior con Docker disponible.
