# BE-022 — Handoff QA

**Estado:** `PASS`  
**Candidate-ID:** `db27cc3+4ec4aabeae61` (firma confirmada)

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
