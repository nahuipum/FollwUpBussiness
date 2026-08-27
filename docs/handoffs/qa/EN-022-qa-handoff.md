# EN-022 — Handoff QA Backend

**Estado:** `PASS`  
**Candidate-ID:** `9e030b7 + route-create-max-50`

| Criterio | Implementación | Prueba/evidencia | Resultado |
|---|---|---|---|
| Crear hasta 50 clientes | `CreateRouteService.validate` acepta `size() == 50`. | `acceptsTheContractualBoundaryOfFiftyCustomers`: crea y persiste 50 puntos. | PASS |
| Rechazar 51 sin efectos | Validación `size() > 50` antes de fingerprint y reserva idempotente. | `rejectsMoreThanFiftyCustomersBeforeAnyWrite`: `Invalid` y cero interacciones con store, puertos de referencias, alcance y auditoría. | PASS |
| Contrato público | `CreateRouteRequest.customerIds.maxItems: 50`. | Diff de `docs/api/openapi.yaml`; coincide con runtime. | PASS |

Evidencia: `mvn -q '-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository' '-Dtest=CreateRouteServiceTest' test` — PASS (6 pruebas, 0 fallos); `git diff --check` — PASS.

Hallazgos: ninguno. Migraciones, permisos, tenant y arquitectura no cambian; la validación conservó sus controles existentes. Riesgo residual: no se ejecutó la suite completa, proporcional al cambio local de límite.
