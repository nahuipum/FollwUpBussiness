# FE-001 — Desarrollo Backend (remediación de prueba logout WEB)

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD 7099a83644a10efd2979626bcb8acfaba9318f29 + worktree-product 6526367c21ecf761c765419888c6a03c80e7ff8cac6003233dc9b670fc17fbfd`.

## Alcance y archivos

- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LogoutControllerTest.java`

Solo se ajustó la prueba respecto a `abe62489…`. No cambiaron producción, OpenAPI, seguridad, cookies productivas ni migraciones.

## Evidencia

- `mvn -q '-Dtest=LogoutControllerTest' test` — PASS sobre el Candidate-ID vigente tras el ajuste case-insensitive.
- `mvn -q '-Dtest=LoginControllerTest,LogoutControllerTest,RefreshControllerTest,SecurityErrorDispatchIntegrationTest,SecurityConfigurationTest,InboundJwtAuthenticatorTest,InboundJwtAuthenticationFilterTest,LoginServiceTest' test` — PASS antes del último ajuste case-insensitive.

La prueba valida el logout WEB 204 y el `Set-Cookie` contractual por atributos independientes: `__Host-fs-refresh` vacío, `Path=/`, `Max-Age=0`, `Secure`, `HttpOnly`, `SameSite=Strict`, sin `Domain`; tolera `Expires` adicional. MOBILE y rechazos no emiten `Set-Cookie`.

## Riesgo y reproducción

La regresión agrupada permanece PASS y la dirigida fue reejecutada sobre el diff exacto. Desarrollo queda listo para handoff; QA Backend debe validar independientemente el candidato vigente.
