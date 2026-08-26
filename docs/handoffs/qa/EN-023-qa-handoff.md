# QA Backend — EN-023 (revalidación)

Estado: `PASS`  
Candidate-ID: `HEAD+284907064a21` (coincide con paquete y handoff; superficie EN-023 sin delta posterior, excluidos handoffs).

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Escritura sólo con lock de la transacción dueña | `guard_lock_txid=txid_current()` al adquirir; `markStarted` exige el mismo `txid_current()` | `rejectsMarkStartedWithoutTheTransactionThatAcquiredTheGuardAndKeepsItNotStarted`: excepción y `started_at` nulo. |
| Flujo válido | La misma transacción adquiere y marca la triple | `isolatesTenantAndReadsOnlyTheExactGuard`: `NOT_STARTED` → `STARTED`. |
| Aislamiento y lock sin regresión | Predicados/PK tenant-seller-fecha y `FOR UPDATE` | Las dos pruebas de integración existentes verifican tenant independiente y bloqueo hasta completar la transacción. |

Evidencia: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=JdbcJourneyStartGuardStoreIntegrationTest' test`: PASS. `git diff --check`: PASS. Se reutiliza `clean verify` PASS declarado por Desarrollo para este Candidate-ID.

Hallazgos reproducibles: ninguno. Riesgo residual: BE-028 deberá adquirir y marcar dentro de una única transacción y derivar `tenantId` del contexto autenticado; no hay endpoint ni transición en este alcance.
