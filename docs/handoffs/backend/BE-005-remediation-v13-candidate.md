# BE-005 — Remediación H-03 — candidato v13

## Estado

`CANDIDATE_NEW — NO READY_FOR_HANDOFF`.

HU: `BE-005 — Cerrar y revocar sesión`.

Origen: `docs/handoffs/governance/BE-005-context-package-v12-candidate-manifest.md` y hallazgo H-03 de `docs/handoffs/backend/BE-005-backend-qa-v12.md`. Este documento no autoriza QA, Seguridad final ni DoF.

## Alcance

Se consume el digest del ticket de revocación móvil mediante una única actualización condicional de PostgreSQL: ticket presente, familia no revocada, no vencida y canal `MOBILE`. La actualización limpia el digest y retorna la familia únicamente cuando el consumo tuvo éxito. El replay no resuelve familia, se rechaza y no registra un segundo `LOGGED_OUT`.

El consumo, revocación, instalaciones y auditoría siguen dentro de la transacción ya provista por `LoginConfiguration`; por ello, un fallo posterior revierte también el consumo. No se modificaron reglas de tenant, autorización, transporte, contratos públicos ni migraciones.

## Archivos del delta H-03

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/out/RefreshSessionPort.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcRefreshSessionAdapter.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionService.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionServiceTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java`

## Contratos y migraciones

No hay cambio de contrato externo ni migración. El puerto interno sustituye la resolución de ticket por `consumeRevocationTicket`, para expresar el consumo atómico requerido.

## Verificación

- `mvn clean "-Dtest=LogoutSessionServiceTest" test` — PASS, 8 pruebas.
- `mvn "-Dtest=RefreshSessionTransactionIntegrationTest" test` — PASS, 9 pruebas; Docker/Testcontainers PostgreSQL/PostGIS y Flyway hasta V11.
- `git diff --check` — PASS.
- `graphify update .` — PASS.

Las pruebas nuevas verifican que el primer ticket pendiente revoca/consume, que el segundo uso se rechaza, que no queda digest y que la auditoría de éxito permanece en uno. La integración preserva además la evidencia de vencimiento y rollback de auditoría existente.

## Identidad de candidato

- HEAD: `3a787569ca873f084e0b6f0e052988933935cda7`.
- Hash de `git diff HEAD`: `fe5e66df0b2cc27c9fd25d2065c2b094640a5cbd`.
- Staging: vacío.

El worktree contiene cambios ajenos preexistentes; no fueron modificados ni incluidos como alcance de esta remediación.

## Riesgo y reproducción

Riesgo residual: el candidato necesita un paquete de contexto v13 y preflight nuevo que fijen sus huellas antes de cualquier fase posterior.

Reproducción cubierta: asignar a una familia `MOBILE` activa un `revocation_ticket_digest` válido; ejecutar el logout pendiente dos veces en transacciones separadas. La primera llamada devuelve éxito y limpia el digest; la segunda se rechaza y el conteo de auditorías `LOGGED_OUT` de la familia permanece en uno.

## Siguiente gate

El Orquestador debe generar paquete v13 y solicitar preflight nuevo para este candidato. Hasta que ambos artefactos existan y se validen, el estado no puede convertirse en `READY_FOR_HANDOFF`.
