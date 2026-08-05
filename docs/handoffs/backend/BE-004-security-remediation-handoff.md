# Backend Handoff — BE-004 Remediación de Seguridad

## Estado

READY_FOR_HANDOFF

## Candidato y alcance

- Entrada: manifiesto v3 SHA-256 `8036c6ad13e483e99fcbb0288bbb3b9b59f7df78a5d4e3d195667b68706ec83e`.
- Remediación limitada a `SEC-BE004-02` y `SEC-BE004-09`; no se modificó OpenAPI, infraestructura, límites de otros controles ni cambios ajenos.

## Implementación

- `RefreshSessionPort` y `JdbcRefreshSessionAdapter` actualizan `csrf_token_digest` junto al CAS que consume C0 y crea el refresh sucesor. `RefreshService` genera C1 antes de la mutación y lo devuelve solo después del commit.
- Los caminos de replay usan el `correlationId` saneado recibido en el comando; no se genera un UUID sustituto. El comando audit persiste `reason` con vocabulario cerrado, y el adaptador almacena únicamente `channel`, `result` y `reason` técnicos.
- `V10__support_anonymous_authentication_audit_and_refresh_history.sql` amplía la allowlist de `after_state` a la clave técnica `reason`, sin admitir payload, tokens ni PII.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/RefreshService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/out/RefreshSessionPort.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcRefreshSessionAdapter.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/persistence/JdbcAuthenticationAuditAdapter.java`
- `backend/followupbussiness/src/main/resources/db/migration/V10__support_anonymous_authentication_audit_and_refresh_history.sql`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java`
- Ajuste de firma en `RefreshServiceTest`.

## Evidencia por control

| Control | Evidencia |
|---|---|
| SEC-BE004-02 | `webRefreshRotatesCsrfAndRejectsThePreviousValue`: en PostgreSQL/Flyway, C0 acepta R0, entrega C1; C1 acepta R1 y entrega C2; C0 contra R2 es rechazado. La actualización CSRF forma parte del CAS/transaction del sucesor. |
| SEC-BE004-09 | `concurrentRefreshCreatesOneSuccessorAndOneContractualReplay`: dos solicitudes con el mismo correlationId producen un único sucesor y un `ALREADY_ROTATED`; el registro de replay conserva ese correlationId y `reason=REPLAY`, sin incluir el refresh presentado. |

## Comandos y resultados

- `mvn -q "-Dtest=RefreshServiceTest,RefreshControllerTest,RefreshRateLimiterTest,RefreshSessionTransactionIntegrationTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS.
- `git diff --check`: PASS.

## Reproducción

Desde `backend/followupbussiness`, ejecutar el comando Maven anterior. `RefreshSessionTransactionIntegrationTest` inicia PostgreSQL/Testcontainers, aplica Flyway V10 y verifica CSRF consecutivo, carrera/auditoría y rollback físico.

## Riesgos residuales

Se reutilizan los riesgos operacionales ya aprobados para Redis/HMAC/proxy. Esta remediación no altera esos controles.

## Lecturas excepcionales

Ninguna. Se usaron exclusivamente el paquete v4, los handoffs de QA/Seguridad y fuentes de código/pruebas afectadas.
