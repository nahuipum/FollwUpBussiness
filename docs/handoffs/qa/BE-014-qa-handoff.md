# BE-014 — Handoff QA

**Estado:** `PASS`
**Candidate-ID:** `HEAD b438de1 + diff BE-014 final (PATCH clientes, validación GeoPoint y evidencia tenant/rol)`.

## Mapeo y evidencia

- Corrección previa: `Update.location` incorpora `@Valid`; `latitude: null` devuelve 400 antes del caso de uso.
- `tenantAdminCannotRevealExistingForeignCustomerOrCauseEffects`: con `If-Match` vigente, admin A recibe `NotFound`; sólo se consulta `(tenantA,id)`, nunca B, y no hay update/auditoría. El mapeo HTTP existente lo traduce a 404 genérico, sin PII/coordenadas.
- `ownerSupervisorIsRejectedBeforeStoreAndAudit`: SUPERVISOR del tenant propietario recibe `Forbidden` antes de store/auditoría; el controlador lo traduce a 403.

## Comandos

- `mvn -q '-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository' '-Dtest=UpdateCustomerServiceTest' test` — PASS.
- `git diff --check` — PASS. Reutilizada CI completa `clean verify` PASS de Development: el delta es sólo de pruebas, sin cambio de producción.

Sin hallazgos en el alcance test-only. Riesgo residual: no se reejecutaron criterios ajenos; se conserva su evidencia previa y la CI reutilizada.
