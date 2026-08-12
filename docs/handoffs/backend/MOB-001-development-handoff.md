# MOB-001 — Desarrollo Backend

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `e887055 + status:df7f5c59bbb1`

## Alcance

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LoginService.java`: para `X-Auth-Client: MOBILE`, solo `BaseRole.SELLER` llega a crear una familia de sesión o emitir JWT/refresh/ticket. Cualquier otro rol produce `LoginFailedException`; el controlador ya la traduce a `401 AUTHENTICATION_FAILED` neutral.
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/application/LoginServiceTest.java`: cubre PLATFORM_SUPERADMIN, COMPANY_ADMIN y SUPERVISOR, verificando cero creación de sesión y cero emisión de token. El caso SELLER MOBILE existente conserva el éxito.

No hay migraciones ni cambios de contrato. Recuperación/reset queda fuera del cambio: sus endpoints mantienen aceptación neutral y el envío se delega al puerto backend `IdentityNotificationPort`.

## Criterios → evidencia

- Éxito MOBILE SELLER: `activeCompanyAccountCreatesSessionWithServerDerivedTenantAndRole`.
- Denegación de roles no exclusivamente SELLER y ausencia de familia/tokens: `mobileRejectsEveryNonSellerRoleBeforeCreatingSessionOrIssuingToken`.
- Respuesta neutral 401 sin cookie: cobertura existente en `LoginControllerTest` y captura de `LoginFailedException` en `LoginController`.
- Concurrencia/idempotencia: no se modifica la semántica ni el puerto de persistencia de familias; fuera de este diff.

## Verificación

`mvn -q '-Dtest=LoginServiceTest,LoginControllerTest' test` — PASS.  
`git diff --check` — PASS.

## Riesgos y reproducción

El modelo actual tiene exactamente un `BaseRole` por cuenta; si evoluciona a roles múltiples, la guarda debe exigir conjunto `{SELLER}`. Para reproducir, iniciar sesión MOBILE con credenciales válidas de COMPANY_ADMIN: responde `401 AUTHENTICATION_FAILED` sin credenciales ni familia persistida.
