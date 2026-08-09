# FE-001 — QA

## QA Backend

**Estado:** PASS
**Candidate-ID confirmado:** `HEAD 7099a83644a10efd2979626bcb8acfaba9318f29 + worktree-product 6526367c21ecf761c765419888c6a03c80e7ff8cac6003233dc9b670fc17fbfd`.

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Logout WEB 204 y limpieza contractual | `LogoutController` emite `Set-Cookie` de borrado solo tras éxito | `LogoutControllerTest` PASS: nombre/valor vacío, `Path=/`, `Max-Age=0`, `Secure`, `HttpOnly`, `SameSite=Strict`, sin `Domain`; acepta `Expires` adicional |
| Token/sesión anterior revocados | `LogoutSessionService` revoca familia autenticada; JWT entrante verifica estado | `LogoutSessionServiceTest`, `RefreshSessionTransactionIntegrationTest`, `InboundJwtAuthenticatorTest` PASS |
| MOBILE y rechazo/no-op sin cookie ni efectos | Ramas PENDING separan ticket/cookie y rechazan combinaciones inválidas antes del caso de uso | `LogoutControllerTest` PASS: MOBILE sin `Set-Cookie`; credenciales mezcladas/no autorizadas no invocan el caso de uso |
| Regresión de autenticación y dispatcher | Filtro JWT, CORS y configuración de seguridad | `LoginControllerTest`, `RefreshControllerTest`, `SecurityErrorDispatchIntegrationTest`, `SecurityConfigurationTest`, `InboundJwtAuthenticationFilterTest` PASS |
| Tenant, replay e idempotencia | Revocación usa familia, cuenta y `tenantId`; ticket de revocación se consume una vez | `LogoutSessionServiceTest`, `RevocationTicketIntegrityIntegrationTest`, `RefreshSessionTransactionIntegrationTest` PASS |

Comandos/evidencia: `mvn -q "-Dtest=LoginControllerTest,LogoutControllerTest,RefreshControllerTest,SecurityErrorDispatchIntegrationTest,SecurityConfigurationTest,InboundJwtAuthenticatorTest,InboundJwtAuthenticationFilterTest,LoginServiceTest" test` PASS; `mvn -q "-Dtest=LogoutSessionServiceTest,RevocationTicketIntegrityIntegrationTest,RefreshSessionTransactionIntegrationTest" test` PASS, incluidas migraciones V23 en contenedor efímero. No se reinició la JVM HTTPS existente; no hubo credenciales WEB para reproducir el flujo remoto sin exponer sesiones.

Hallazgos: ninguno. Regresión relevante: login, logout, refresh, JWT, CORS, error dispatch, revocación y replay. Riesgo residual: la interacción navegador/TLS real no fue reproducida independientemente; los atributos HTTP y el flujo de sesión están cubiertos por pruebas de controlador, aplicación e integración. Migraciones: PASS; arquitectura: sin cambio en producción para este delta.

## QA Frontend

**Estado:** PASS
**Candidate-ID confirmado:** `HEAD 7099a83644a10efd2979626bcb8acfaba9318f29 + worktree-product 6526367c21ecf761c765419888c6a03c80e7ff8cac6003233dc9b670fc17fbfd`. No se modificó producto. Se reutilizan typecheck, build y 22 pruebas PASS del handoff Dev.

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Validación, error genérico, redirección, acceso directo, roles y a11y | `LoginForm`, `useLoginForm`, `App`, `useSessionRoute`, diálogos | 22 pruebas PASS reutilizadas: validación, error, rutas/roles, foco, Escape, restauración y carga. |
| Login WEB, cookie y logout | `api.ts`, `auth.ts`, proxy HTTPS | Sesión Edge/CDP limpia: cookie inicial ausente; login 200; una cookie `__Host-fs-refresh` creada para `localhost`, `Path=/`, `Secure`, `HttpOnly`, `SameSite=Strict`; logout 204 con `credentials: include`; `Network.responseReceivedExtraInfo` contiene la cookie de borrado contractual, sin bloqueo; almacén final sin la cookie. PASS. |
| Revocación tras logout | Backend logout/refresh/JWT | Access token anterior 401; refresh anterior 400 sin cookie y rechazado. PASS. |
| Nueva sesión funcional | Login/refresh WEB | Segundo login 200, cookie nueva, refresh 200 y Bearer nuevo hacia `/platform/companies` 404: autenticación superada y handler fuera de alcance. PASS. |
| TLS/CORS/mixed content; mapa/WebSocket | `vite.config.ts`, `api.ts` | Node con CA del sistema: Backend 401 protegido y Frontend 200; CORS preflight 200 con origen permitido; credenciales inválidas por email/usuario 401. Mapa/WebSocket NOT_APPLICABLE. |

Comandos reutilizados: suite dirigida Frontend (22 pruebas), `npm run typecheck` y `npm run build`, todos PASS. El método anterior era inválido: `Set-Cookie` no es legible desde Fetch y una cookie `HttpOnly` no se valida con `document.cookie`. La evidencia corregida usó CDP y el almacén real, sin registrar secretos.

No hay hallazgos. La causa del dictamen anterior fue medición QA A/H: `Set-Cookie` no es visible desde Fetch y la cookie `HttpOnly` se comprobó correctamente mediante CDP/almacén. Firma rápida `326f…` y `git diff --check -- frontend/followupbussiness` PASS. No se registraron credenciales, cookies ni tokens.
