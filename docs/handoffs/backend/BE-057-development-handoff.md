# BE-057 — Development handoff

- Estado: `READY_FOR_HANDOFF`
- Candidate-ID: `HEAD 420a67a + BE-057 diff ea0352867342`
- Alcance: Desarrollo Backend — remediación exclusiva de las dos brechas de pruebas QA.

## Cambio

- Se añadieron dos pruebas PostgreSQL/Flyway al caso real BE-057 en
  `InitialCompanyAdminUniquenessIntegrationTest`.
- No se modificó producción: las pruebas confirmaron el comportamiento vigente.

## Evidencia de Desarrollo

- Nuevas aisladas: 2/2 PASS.
- Focalizado BE-057: 10/10 PASS (`ProvisionInitialCompanyAdminServiceTest`,
  `InitialCompanyAdminControllerTest`, `InitialCompanyAdminUniquenessIntegrationTest`).
- Regresión directa de auditoría: 17/17 PASS (`RecordCompanyDenialAuditTest`,
  `AuditEntryMigrationTest`). Total focalizado único: 27 pruebas.
- Fallo del writer real: `JdbcAuditEntryStore` lanza durante el éxito y la
  operación falla; PostgreSQL queda con cero cuenta, cero `COMPANY_ADMIN`, cero
  token de activación, cero notificación y cero auditoría parcial para la empresa.
- Rechazo tenant-bound: el endpoint responde `403`; tras el rollback persiste una
  sola auditoría `TENANT_BOUND_DENIAL` con actor/tenant, acción
  `PROVISION_INITIAL_COMPANY_ADMIN`, recurso `COMPANY`, empresa destino, resultado
  `DENIED` y el mismo UUID saneado de respuesta. Cuenta, rol, token y notificación
  quedan en cero; respuesta y evidencia no contienen PII, contraseña, token,
  payload, cabecera ni el correlationId inválido suministrado.
- `git diff --check`: PASS.

## Pendiente

- QA afectado no fue iniciado. Prompt mínimo: `QA Backend BE-057: valida el
  Candidate-ID ea0352867342 y reejecuta solo las dos pruebas nuevas, el focalizado
  BE-057, la regresión directa de auditoría y git diff --check.`
