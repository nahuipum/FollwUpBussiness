# Seguridad — EN-023

**Estado: `PASS`**  
**Candidate-ID:** `HEAD+284907064a21`; coincide en paquete, Desarrollo y QA, sin delta posterior observado en la superficie EN-023.

## Superficie revisada

Remediación del guard PostgreSQL, `V49__enforce_journey_start_guard_transaction.sql` y prueba negativa afectada. Se reutilizaron los PASS del mismo candidato para aislamiento tenant, lock concurrente, flujo válido, estado exacto y traducción de fallos.

## Cierre del hallazgo

- **Media anterior — PASS:** `stateForUpdate` registra `guard_lock_txid=txid_current()` sobre la triple exacta mientras la transacción posee el lock. `markStarted` exige simultáneamente `tenant_id`, `seller_id`, `business_date`, `started_at is null` y el mismo `txid_current()`; una transacción distinta no puede consumir el recibo.
- **Abuso reproducido — PASS:** `JdbcJourneyStartGuardStoreIntegrationTest#rejectsMarkStartedWithoutTheTransactionThatAcquiredTheGuardAndKeepsItNotStarted` adquiere el guard, libera la transacción y luego intenta marcarlo. Maven dirigido: PASS; se observa excepción y `started_at IS NULL`, sin escritura prohibida.
- **Tenant/datos — PASS:** la remediación no elimina ningún predicado tenant ni agrega endpoint, datos personales, ubicación, logs o detalle de error sensible. El estado expuesto continúa limitado a `STARTED/NOT_STARTED/Unavailable`.

## No aplicable y riesgo residual

No aplican en este delta: auth/REST, secretos, WebSocket, Redis, mensajería, archivos e infraestructura pública. Riesgo residual aceptado para el alcance: BE-028 deberá ejecutar adquisición y marcado en una sola transacción y derivar `tenantId` del contexto autenticado para evitar BOLA indirecta.
