# BE-022 — Handoff QA

**Estado:** `PASS`  
**Candidate-ID:** `9e030b7+704024ea0bf7` (delta Directions y remediación de Seguridad verificados)

## Mapeo y evidencia

- Reserva durable de cuota → `JdbcMatrixQuota` con `REQUIRES_NEW` → 35 fallos `Unavailable` dentro de transacciones exteriores mantienen `used_matrices=35`, cero propuestas → PASS.
- Llamada 36 → `RateLimited` antes de Matrix → exactamente 35 llamadas Matrix y ninguna propuesta adicional → PASS.
- REST de cuota agotada → controlador → 503 seguro `PROVIDER_RATE_LIMITED`, sin cuenta expuesta → PASS.
- Regresión principal → arcos asimétricos, no publicación, permisos pre-Matrix y versiones concurrentes → conjunto focal → PASS.

## Evidencia ejecutada

- `mvn -q '-Dtest=JdbcMatrixQuotaIntegrationTest,OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest' test` — PASS.
- `mvn -q clean verify` — PASS reutilizado para este candidato.
- `git diff --check` — PASS.

## Riesgo residual

Mapbox/OR-Tools productivos permanecen `NOT_EXECUTED`; el adaptador continúa fail-closed y sin fallback.

## Delta QA — Directions seguridad

`PASS`: `RoutingConfiguration` obtiene `MAPBOX_DIRECTIONS_TOKEN` únicamente mediante `System.getenv`, sin binding de Mapbox ni lectura de `.env` en este flujo. `MapboxDirectionsAdapter` rechaza respuestas `200` sin una ruta utilizable, incluido `{"routes":[{}]}`, y el controlador responde `503 DIRECTIONS_UNAVAILABLE`. `mvn -q '-Dtest=MapboxDirectionsAdapterTest,RouteControllerTest' test` y `git diff --check` — PASS; sin llamadas live ni secretos. Riesgo residual: falta validación con el proceso desplegado.

## Delta QA — Directions, origen y autorización

`PASS` sobre `9e030b7+704024ea0bf7`: ya no corresponde `422` por `startLocation` ausente; `GetRouteDirectionsService` ordena los puntos por `sequence` y usa el primero como origen, exigiendo al menos dos visitas. El origen explícito se preserva y se antepone. La ruta inválida (una visita sin origen o más de 50) y la denegación/no encontrada no llaman al proveedor; la autorización y el tenant siguen pasando por `ReadRoutesUseCase.get` antes de `RouteDirections`. Evidencia: `mvn "-Dtest=GetRouteDirectionsServiceTest,MapboxDirectionsAdapterTest,RouteControllerTest" test` — PASS (11 pruebas). No se recibió evidencia frontend inline/reintento aplicable a este handoff.
