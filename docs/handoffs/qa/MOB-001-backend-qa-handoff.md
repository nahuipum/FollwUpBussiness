# MOB-001 — QA Backend

**Estado:** PASS  
**Candidate-ID:** `e887055 + status:df7f5c59bbb1`

## Mapeo y evidencia

- MOBILE no `SELLER` → guarda en `LoginService` antes de familia/JWT → `mobileRejectsEveryNonSellerRoleBeforeCreatingSessionOrIssuingToken` y `LoginControllerTest` → 401 `AUTHENTICATION_FAILED`, sin cookie, familia ni tokens.
- MOBILE `SELLER` → flujo de sesión existente → `activeCompanyAccountCreatesSessionWithServerDerivedTenantAndRole` → sesión con tenant derivado y refresh válido.
- Recovery neutral y correo backend → `PasswordRecoveryService.accept/request` y gateway SMTP → pruebas de aceptación genérica, cuenta ausente y enlace local → no resuelve cuenta en entrada; token opaco solo en correo `http://localhost:5173/password-reset?token=...`.
- Reset de un uso → `consume` antes de mutar, revocación por cuenta/tenant → `invitedAccountActivatesWithoutChangingTenantOrRoleAndRevokesAllSessions` → invalida sesiones y tokens de cuenta.

## Comandos/evidencia

`git rev-parse --short HEAD` = `e887055`; `git status --porcelain` revisado; `git diff --check` PASS.  
`mvn -q '-Dtest=LoginServiceTest,LoginControllerTest,PasswordRecoveryServiceTest,IdentityNotificationDeliveryWorkerTest,SmtpTransactionalEmailGatewayTest' test` — PASS.

## Hallazgos y riesgos

Sin hallazgos bloqueantes. Riesgo residual bajo: no hay prueba explícita de doble consumo concurrente del token; la implementación consume antes de la mutación y la suite cubre rechazo de token inválido/expirado. Sin migraciones ni cambios de límites hexagonales en este candidato.
