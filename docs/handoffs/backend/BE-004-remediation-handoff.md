# Backend Handoff — BE-004 Remediación

## Estado

READY_FOR_HANDOFF

## Candidato y alcance

- Base: `a7e444a684d032be4da9ee4aac48528a33bd5fd7` más ADR-021, paquetes/handoffs BE-004 y el diff Backend actual; no hay commit ni PR.
- Implementado `/auth/refresh` sin modificar `docs/api/openapi.yaml`: separación WEB/MOBILE, CSRF, correlación saneada, no-store, rotación, replay, emisión RS256, Redis fail-closed y auditoría transaccional.
- Remediación ADR-021: puerto público tipado `RecordAuthenticationAuditUseCase`, adaptador propietario de `audit` y misma transacción PostgreSQL del refresh.

## Archivos principales

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/RecordAuthenticationAuditCommand.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/port/in/RecordAuthenticationAuditUseCase.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/persistence/JdbcAuthenticationAuditAdapter.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/RefreshService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/RefreshController.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcRefreshSessionAdapter.java`
- `backend/followupbussiness/src/main/resources/db/migration/V10__support_anonymous_authentication_audit_and_refresh_history.sql`

## Contratos y migraciones

- OpenAPI estable: sin cambios.
- V10 añade historial de digests consumidos, marca de rotación y soporte de auditoría anónima; conserva las restricciones históricas de `status` y amplía allowlist únicamente a `channel` y `result` técnicos.
- La migración concede INSERT al rol ejecutor de migración para la auditoría crítica, sin acceso de `identityaccess` a adaptadores/tablas de `audit`.

## Matriz de controles

| Control | Código y evidencia reproducible |
|---|---|
| SEC-BE004-01 | `RefreshService` carga cuenta persistida y `Rs256AccessTokenAdapter`; `RefreshServiceTest` valida emisión y estado. |
| SEC-BE004-02 | `RefreshController` y `RefreshControllerTest`: cookie+CSRF WEB, body MOBILE, rechazo de contexto navegador/downgrade. |
| SEC-BE004-03 | CAS/bloqueo en `JdbcRefreshSessionAdapter`; `RefreshSessionTransactionIntegrationTest` ejecuta dos canjes sincronizados: un éxito y un `ALREADY_ROTATED`, un solo digest consumido. |
| SEC-BE004-04 | Historial de consumidos, ventana de cinco segundos y revocación en `RefreshService`; pruebas unitarias de replay. |
| SEC-BE004-05 | `expires_at` no se recalcula; `RefreshServiceTest` comprueba expiración absoluta y rechazos revocado/expirado. |
| SEC-BE004-06 | Cuenta/empresa/rol provienen de consultas persistidas y se valida estado activo; pruebas unitarias de estado. |
| SEC-BE004-07 | `RefreshRateLimiter`: 120/min digest presentado+IP antes de PostgreSQL, 30/min familia+IP al resolver; claves HMAC, IP del peer servlet y `503` fail-closed. `RefreshRateLimiterTest`. |
| SEC-BE004-08 | Respuestas neutrales, `no-store`, `Pragma`, UUID correlation saneado y ausencia de cookie de fallo/MOBILE; `RefreshControllerTest`. |
| SEC-BE004-09 | Puerto público tipado y adaptador audit-owned con campos técnicos cerrados; carrera persiste ambos resultados sin secretos. |
| SEC-BE004-10 | `TransactionTemplate` comparte `DataSource`; integración Testcontainers verifica carrera y que un fallo de audit revierte consumo, sucesor y entrada audit. |

## Pruebas y resultados

- `mvn -q -DskipTests compile`: PASS.
- `mvn -q "-Dtest=RefreshServiceTest,RefreshRateLimiterTest,RefreshControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS.
- `mvn -q "-Dtest=AuditEntryMigrationTest" test`: PASS; Flyway limpia y migra V10.
- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest" test`: PASS; carrera y rollback físico PostgreSQL/Testcontainers.
- `git diff --check`: PASS.
- `graphify update .`: PASS; grafo de código actualizado tras el diff.

## Lecturas excepcionales

- Se reutilizó la lectura excepcional de OpenAPI ya registrada en `BE-004-backend-handoff.md`.
- Sin nuevas relecturas de fuentes primarias fuera del paquete v2 y ADR-021.

## Riesgos y reproducción

- Riesgo residual: la configuración productiva debe mantener Redis y PostgreSQL disponibles; Redis falla cerrado con `503` y PostgreSQL sigue siendo fuente de verdad.
- Reproducir carrera/rollback: ejecutar `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest" test` desde `backend/followupbussiness`.
