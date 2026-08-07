# Paquete de contexto — FE-001

**HU:** FE-001 — Pantalla de inicio de sesión  
**Estado:** READY_FOR_HANDOFF  
**Candidate-ID vigente:** `HEAD 12dd1eb + diff e82d07dfae52d73092db127b4a5be79610e57848`  
**Alcance:** formulario web React/TypeScript, autenticación mediante `POST /auth/login`, estado de sesión y redirección posterior.

## Criterios e invariantes verificables

- Validar identificador y contraseña antes de enviar; el contrato exige `identifier` (correo o usuario, 3–254) y `password` (8–200).
- Éxito: petición web con `X-Auth-Client: WEB`, `X-Client-Instance-Id` UUID estable y credenciales; aceptar únicamente la respuesta `channel: WEB`. El access token queda solo en memoria; el navegador administra la cookie refresh HttpOnly. Conservar CSRF solo mediante el mecanismo de sesión existente.
- Denegación: para `401 AUTHENTICATION_FAILED`, mostrar un único error genérico. No enumerar identificador, contraseña, cuenta, empresa o estado.
- Límite/degradación: tratar `429 AUTH_RATE_LIMITED` y `503 AUTH_RATE_LIMIT_UNAVAILABLE` sin revelar causa sensible; respetar `Retry-After` cuando esté presente.
- Fallo: ante respuesta no exitosa, canal inválido, error de red o respuesta malformada, no crear sesión ni conservar contraseña, access token, CSRF, caché o estado residual. No enviar reintentos automáticos con credenciales.
- La contraseña inicia oculta; no debe aparecer en UI accidental, logs, analítica, errores, caché ni almacenamiento. Observabilidad permitida: resultado/categoría y `correlationId`, sin identificador, credenciales, tokens ni PII.
- Autorización sigue siendo del servidor; la redirección no concede permisos.

## Contrato y decisiones ya definidas

- `POST /auth/login`, sin seguridad previa. Respuestas: `200` web, `400`, `401`, `429`, `503`, `500`; `Cache-Control: no-store`, `Pragma: no-cache` y `X-Correlation-Id` cuando corresponda.
- Web requiere Origin permitido y `X-Auth-Client: WEB`; no usar body de refresh ni intentar leer/guardar/exponer refresh token. El JSON web contiene `credentials.accessToken`, `csrfToken` y `user` (roles y empresa). `credentials.accessToken` expira en 600 s.
- Roles contractuales: `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR`, `SELLER`. Tenant/rol declarados por cliente no son autoridad.
- Navegación WEB post-login definida por ADR-008: `PLATFORM_SUPERADMIN` → `/platform/companies`; `COMPANY_ADMIN` → `/company/dashboard`; `SUPERVISOR` → `/supervisor/dashboard`; `SELLER` → `/seller/dashboard`. La navegación es posterior al éxito y no sustituye las guardas ni la autorización del servidor.
- Referencia visual obligatoria: `docs/frontendMockups/FE-001.html`; implementar su composición, tokens, jerarquía, responsividad y estados sin copiar su HTML ni modificarlo.

## Riesgos y pruebas esperadas

- Riesgos: fuga de contraseñas/tokens, estado de sesión residual, enumeración de cuentas/empresa, cruce de tenant y redirección indebida.
- Pruebas: validación; error genérico para 401; ocultamiento de contraseña; request web correcto con headers y credenciales; no persistencia tras fallos; las cuatro redirecciones definidas; observabilidad sin secretos.

## Criterios de cierre del bloqueo

- La decisión de navegación WEB queda documentada en ADR-008 y resumida arriba.
- Desarrollo debe implementar las cuatro rutas/guardas necesarias y probar la redirección por cada rol, sin derivar autoridad del cliente.
