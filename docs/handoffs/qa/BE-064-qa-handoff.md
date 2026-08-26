# QA Backend — BE-064

- Estado: **PASS**
- Candidate-ID verificado: `HEAD+adf01a367feb39b36ddcf4aa7f9a80a41e0207a8` (HEAD `6c14ac05776ab279da1a4d35c86e22f9752448b3`; digest actual coincidente).

## Mapeo verificado

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Admin por tenant; supervisor solo por equipo; seller denegado | `findForUpdate(tenantId, routeId)` y `authorize` comprueba tenant y `PortfolioAccessScope`; `validate` restringe roles. | Revisión directa; `tenantOrScopeDenialDoesNotReadSnapshotWriteOrAudit` PASS. |
| Permutación, snapshot e If-Match | Validación de versión, permutación y snapshot bloqueado; controlador conserva `If-Match`. | `reordersCompletePermutationFromSnapshotWithoutMatrixCallAndCreatesRevision` PASS. |
| PUBLISHED solo `NOT_STARTED`; STARTED/Unavailable sin efectos | Guard transaccional por tenant/vendedor/fecha antes de snapshot, mutación, auditoría y outbox. | Casos positivo y negativo en `ReorderRoutePointsServiceTest` PASS; `JdbcJourneyStartGuardStoreIntegrationTest` incluido en `clean verify` PASS reutilizado. |
| Outbox `route.modified` mínimo; DRAFT sin evento | Evento solo tras auditoría, con IDs técnicos, tenant, versión y correlación; DRAFT no consulta guard/outbox. | Assertions de payload/ausencia de interacciones PASS. |

## Evidencia

- `git diff --binary | git hash-object --stdin`: digest coincidente; `git diff --check`: PASS.
- `mvn -q '-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository' -Dtest=ReorderRoutePointsServiceTest test`: PASS.
- `clean verify` completo del mismo candidato: PASS (evidencia reutilizada del orquestador).

## Hallazgos y riesgos

Sin hallazgos reproducibles. Regresión directa: reordenamiento DRAFT, snapshot y auditoría permanecen cubiertos. Riesgo residual bajo: la ruta positiva de supervisor se verifica por la condición de alcance; no hay prueba aislada que la nombre explícitamente.
