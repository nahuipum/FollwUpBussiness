# BE-025 — Handoff de QA

Estado: `PASS`  
Candidate-ID: `6e32542+f45de4cde9c4`

QA independiente confirma que `ReassignRouteService` admite exclusivamente
`PUBLISHED`; `IN_PROGRESS` rechaza sin reasignación, auditoría, outbox ni cierre
de idempotencia. Se retiraron completamente Visits y `V47`; no queda una
integración o migración inerte. `RouteController` y OpenAPI conservan ETag,
correlación e `Idempotency-Key`.

Tenant/BOLA se mantiene con búsqueda por `tenant_id`; `SUPERVISOR` exige que
los vendedores actual y nuevo estén en su equipo. Un replay exacto no duplica
efectos.

Evidencia: `mvn -q -Dtest=ReassignRouteServiceTest test` PASS;
`mvn -q -Dtest=PublishRouteServiceTest test` PASS; `git diff --check` PASS.
Se reutiliza `mvn -q clean verify` PASS del handoff Development para el mismo
candidato.

Hallazgos: ninguno. Riesgo residual: la reasignación durante ejecución queda
explícitamente diferida hasta que Visits tenga ciclo de vida propio.
