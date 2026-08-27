# BE-022 — Handoff Development

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `9e030b7+704024ea0bf7` (working tree, sin commit).

## Alcance

Remediada la evidencia solicitada para optimización: cálculo por prioridad conservando índices originales de matriz asimétrica, totales de viaje/distancia/servicio y propuesta `published=false`. Se validan entradas inválidas como `Invalid`, incluida prioridad `<= 0`; los fallos de Matrix son `Unavailable`; rol y alcance del supervisor se rechazan antes de Matrix. Las visitas no asignadas distinguen `TIME_WINDOW_CONFLICT` de `OUTSIDE_SHIFT`.

Seguridad: la ruta debe pertenecer al vendedor y fecha del comando antes de reservar cuota/Matrix. Se añade el puerto neutral `MatrixQuota` y reserva PostgreSQL atómica de máximo 35 matrices por tenant/cuenta/día antes del proveedor; en composición usa `REQUIRES_NEW`, por lo que queda durable aun cuando Matrix, solver o propuesta fallen. El exceso retorna `503` con `PROVIDER_RATE_LIMITED`, sin IDs en respuesta, logs ni métricas.

La integración PostgreSQL demuestra dos transacciones simultáneas con `CyclicBarrier`, advisory lock y persistencia de versiones 1/2. La prueba descubrió y corrigió dos defectos reales en `JdbcRouteProposalStore`: lectura del retorno `void` de `pg_advisory_xact_lock` y un placeholder SQL excedente en `save`.

Detalle vial manual: `GET /routes/{routeId}/directions` autoriza la ruta antes del puerto neutral `RouteDirections`, compone inicio y puntos ordenados, y retorna geometría, tramos, distancia, duración e indicaciones sin persistir ni modificar la ruta. Mapbox recibe exclusivamente lon/lat, fragmenta hasta 51 coordenadas en solicitudes solapadas de 25 y se mantiene intercambiable. La caché es local por ruta+versión. El token solo se lee del entorno del proceso (`MAPBOX_DIRECTIONS_TOKEN`), nunca de propiedades Spring ni del import `.env`; la ausencia, HTTP no exitoso o respuesta 200 sin ruta utilizable devuelven `503 DIRECTIONS_UNAVAILABLE` sin datos sensibles.

## Archivos, contrato y migración

- Producción: `routing/application/OptimizeRouteService.java`; `routing/adapter/out/persistence/JdbcRouteProposalStore.java`, `JdbcMatrixQuota.java`; `routing/application/GetRouteDirectionsService.java`; `routing/adapter/out/directions/MapboxDirectionsAdapter.java`; `routing/config/RoutingConfiguration.java`.
- Pruebas: optimización existente y `routing/application/GetRouteDirectionsServiceTest.java`, `routing/adapter/out/directions/MapboxDirectionsAdapterTest.java`, `routing/adapter/in/rest/RouteControllerTest.java`.
- Contrato: `docs/api/openapi.yaml` declara Directions neutral y `503` seguro; sin migración nueva.

## Evidencia

- `mvn -q -Dtest=JdbcMatrixQuotaIntegrationTest,OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest test` — PASS.
- `mvn -q clean verify` — PASS.
- `mvn -q -Dtest=MapboxDirectionsAdapterTest,GetRouteDirectionsServiceTest,RouteControllerTest test` — PASS.
- `mvn -q -Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test` — PASS.
- `git diff --check` — PASS.

## Criterios cubiertos y reproducción

Matriz asimétrica vía `optimize` verifica orden, arcos y totales; rol/scope, vendedor y fecha de ruta verifican `verifyNoInteractions(Matrix)`; prioridad no positiva queda en `Invalid`; cuota agotada devuelve `RateLimited` sin Matrix/persistencia y el controlador retorna el código seguro. Testcontainers/Flyway verifica que 35 fallos de Matrix dentro de transacciones exteriores consumen cuota durable y que la llamada 36 no alcanza Matrix ni propuesta.

Riesgo residual: Mapbox/OR-Tools productivos no están provisionados; el puerto sigue fail-closed. Para reproducir, ejecutar el comando focal anterior con Docker disponible.

## Delta — origen implícito de Directions

`GET /routes/{routeId}/directions` ahora conserva `startLocation` cuando existe; cuando no, usa la primera visita ordenada como origen y la última como destino. El endpoint rechaza antes del proveedor rutas vacías, de más de 50 visitas, puntos sin ubicación y una única visita sin inicio explícito: esta última no tiene un tramo vial que pueda inventarse.

- Contrato: `docs/api/openapi.yaml` documenta el origen implícito y la condición mínima de dos puntos sin inicio explícito.
- Pruebas focalizadas: `GetRouteDirectionsServiceTest` cubre origen explícito, origen implícito, límite de 50, autorización previa y el rechazo de una visita sin llamada al proveedor.
- Evidencia: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=GetRouteDirectionsServiceTest' test` — PASS; `git diff --check` — PASS.

Riesgo residual: una ruta de una sola visita sin origen configurado responde `422`; requiere un origen explícito si se necesita detalle vial.
