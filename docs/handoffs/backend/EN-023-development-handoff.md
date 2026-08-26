# Handoff Desarrollo — EN-023

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `HEAD+284907064a21` (runtime, V48/V49, pruebas y enabler EN-023; excluye artefactos de handoff mutables).

## Alcance y contratos

Se materializa el guard transaccional `tenant_id/seller_id/business_date` para
`JourneyStartedStatusUseCase`; `NOT_STARTED` persiste hasta que BE-028 escriba
el inicio real mediante el mismo guard. No hay REST, ubicación, tracking,
evento ni jornada artificial. La escritura valida el recibo `txid_current()`
del lock tomado en la transacción vigente.

## Evidencia

- Migraciones: `V48__create_journey_start_guard.sql` y
  `V49__enforce_journey_start_guard_transaction.sql`.
- Runtime: puerto out, servicio, adaptador JDBC y configuración en `journeys`.
- Pruebas: indisponibilidad, aislamiento tenant, estado exacto, lock entre
  transacciones y rechazo de escritura sin la transacción dueña. Arquitectura
  hexagonal incluida en la ejecución dirigida.

Validación dirigida y `clean verify` completadas antes de QA.
