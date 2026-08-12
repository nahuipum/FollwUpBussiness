# BE-003 — QA independiente (revalidación)

**Estado:** PASS  
**Candidate-ID:** `HEAD 71a31cc + backend-diff f8ae5b88eca5d085f7209b640bd07ab61ba52cb8`

## Mapeo y evidencia

- Empresa ausente/inactiva: login y refresh proyectan `CurrentUser` antes de crear credenciales, cuerpo o cookie; traducen `Unauthenticated` a 401 (`AUTHENTICATION_FAILED` / `REFRESH_TOKEN_INVALID`). Pruebas focalizadas confirman ausencia de `Set-Cookie`; por flujo no se construye ni retorna `credentials`.
- `/me` HTTP: `CurrentUserControllerTest` confirma 401 para anónimo y tokens revocado, bloqueado y suspendido; confirma 200 para `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`, con rol y solamente su empresa ACTIVE.
- Aislamiento: la proyección coteja cuenta, rol y `tenantId`; la consulta de empresa parte exclusivamente del `companyId` autenticado. No se expusieron secretos en la respuesta ni en las evidencias.

## Comandos

- PASS: `mvn -q '-Dtest=CurrentUserProjectionTest,CurrentUserControllerTest,LoginControllerTest,RefreshControllerTest,InboundJwtAuthenticationFilterTest' test`.
- Se reutiliza `mvn -q clean verify` PASS del handoff para el mismo Candidate-ID.

## Riesgo residual

La sesión puede haberse rotado internamente antes de que una empresa cambie de estado, pero no se emiten credenciales/cookie y PostgreSQL rechaza el uso posterior; riesgo aceptable para esta corrección.

**Delta de trazabilidad:** desde la revalidación PASS, únicamente cambió `CurrentUserControllerTest` para el abuso discordante; su comando focalizado ya pasó.
