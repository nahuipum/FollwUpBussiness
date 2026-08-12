# BE-003 — Desarrollo (evidencia Security)

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD 71a31cc + backend-diff f8ae5b88eca5d085f7209b640bd07ab61ba52cb8`

## Alcance y archivos

- `LoginController` y `RefreshController` construyen `CurrentUser` antes de cabeceras, cookie o cuerpo; `Unauthenticated` devuelve rechazo contractual 401, sin credenciales emitidas.
- `CurrentUserController` rechaza actor ausente de modo defensivo. Pruebas añadidas en `LoginControllerTest`, `RefreshControllerTest` y `CurrentUserControllerTest`.
- `CurrentUserControllerTest` añade la evidencia de actor con tenant discordante: `/me` devuelve `401 AUTHENTICATION_FAILED` y no consulta `CurrentCompanyQuery`, por lo que no puede proyectar una empresa ajena.
- Sin cambios de OpenAPI, migraciones ni decisiones de arquitectura.

## Verificación y criterios

- PASS: `mvn -q '-Dtest=CurrentUserProjectionTest,CurrentUserControllerTest,LoginControllerTest,RefreshControllerTest,InboundJwtAuthenticationFilterTest' test`.
- PASS: `mvn -q clean verify`; `git diff --check` sin hallazgos.
- PASS: `mvn -q '-Dtest=CurrentUserControllerTest' test` para la evidencia Security.
- Login con tenant sin empresa utilizable: `401 AUTHENTICATION_FAILED`; refresh: `401 REFRESH_TOKEN_INVALID`; ambos sin `Set-Cookie`.
- `/me` HTTP: anónimo/revocado/bloqueado/suspendido 401; los tres roles tenant devuelven exclusivamente su empresa ACTIVE.

## Riesgo y reproducción

- Riesgo residual: el caso concurrente puede haber creado/rotado sesión internamente antes de rechazar la proyección, pero no emite credenciales ni cookie; la petición posterior sigue su validación PostgreSQL.
- Reproducir: `cd backend/followupbussiness; mvn -q '-Dtest=CurrentUserControllerTest' test`.
