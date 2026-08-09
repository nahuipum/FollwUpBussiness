# FE-001 — Seguridad

**Estado:** PASS
**Candidate-ID:** `HEAD 7099a83644a10efd2979626bcb8acfaba9318f29 + worktree-product 6526367c21ecf761c765419888c6a03c80e7ff8cac6003233dc9b670fc17fbfd`

## Superficie y modelo de amenaza

- Superficie: `SecurityConfiguration`, `LogoutController`, pruebas afectadas, `auth.ts` y cliente API; autenticación, revocación, cookie, CORS y `DispatcherType.ERROR`.
- Activos: access/refresh token, CSRF, familia de sesión, `tenantId` y cookie `__Host-fs-refresh`.
- Actores: usuario WEB, cliente MOBILE y atacante con origen, ticket o token previo/manipulado.
- Límites: navegador/cliente → API HTTPS/CORS → filtros Spring Security/controlador → almacén transaccional de sesiones.
- Abusos revisados: reutilización post-logout, replay de ticket, origen no permitido, mezcla WEB/MOBILE y bypass de autorización mediante error dispatch.

## Resultados y evidencia

- **PASS:** borrado real tras revocación exitosa: valor vacío, `Path=/`, `Max-Age=0`, `Secure`, `HttpOnly`, `SameSite=Strict`, sin `Domain`; QA Backend y Edge/CDP confirman almacén final sin cookie.
- **PASS:** token anterior `401`, refresh anterior `400`; revocación ligada a familia/cuenta/`tenantId`, replay consumido una vez. Evidencia QA Backend/Frontend del mismo candidato.
- **PASS:** WEB exige cookie y origen permitido; MOBILE pendiente usa ticket y no emite `Set-Cookie`; mezclas se rechazan sin invocar el caso de uso.
- **PASS:** CORS refleja únicamente el origen HTTPS configurado con credenciales; origen no configurado `403` sin `Access-Control-Allow-Origin`.
- **PASS (reproducido):** `mvn -q -Dtest=SecurityErrorDispatchIntegrationTest test`; `ERROR` permitido conserva `404` autenticado y el `REQUEST` sin Bearer conserva `401`.
- **PASS:** tokens/CSRF permanecen en memoria; almacenamiento local solo contiene ID de instancia y marcador no sensible; no hay logging ni exposición de secretos en la superficie.
- **FAIL:** ninguno. **NOT_EXECUTED:** escaneos generales/SCA y una segunda sesión navegador, por no cambiar dependencias y existir evidencia QA TLS/CDP verificable.

## Controles no aplicables y riesgo residual

PII/ubicación, WebSocket, Redis/cache, mensajería, archivos, dependencias e infraestructura: no cambian en este diff sensible. Riesgo residual bajo: Seguridad no repitió el flujo TLS completo; reutiliza la evidencia QA real del mismo candidato.
