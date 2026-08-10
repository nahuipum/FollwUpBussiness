# Paquete de contexto — FE-001

**Estado:** READY_FOR_HANDOFF
**Candidate-ID vigente:** `HEAD 4c30919ff7f676292df295229a6aeb0d8769cd69 + diff 12456f0f`
**Rama:** `feature/first`

**Delta:** remedia `SEC-FE001-01`; el proxy valida certificados de destinos HTTPS remotos y conserva `secure: false` únicamente para loopback. No cambia contrato ni amplía la superficie HTTP.

## Alcance vigente

- HU: `docs/stories/frontend/FE-001-pantalla-de-inicio-de-sesion.md`.
- Referencia visual base: `docs/frontendMockups/FE-001.html`.
- Estados complementarios: `docs/frontendMockups/FE-001-login-states.html` (`default`, `loading`, `validation`, `auth-error`, `invalid-session`; escritorio y móvil).
- Frontend: formulario, validación, error genérico, carga, sesión inválida, redirección por rol, logout, navegación y accesibilidad.
- Integración: `/auth/login`, `/auth/logout`, `/auth/refresh`, cookie WEB, CORS y proxy de desarrollo.

## Decisiones vigentes

1. `npm run dev` sirve HTTP por defecto y usa `http://localhost:8080` como proxy. HTTP solo se admite para `localhost`, `127.0.0.1` y `[::1]`; cualquier destino remoto continúa exigiendo HTTPS y validación de certificado.
2. HTTPS local es opcional mediante `FRONTEND_HTTPS_CERT` y `FRONTEND_HTTPS_KEY`; ambas variables deben configurarse juntas.
3. Producción no incorpora el proxy de desarrollo y `VITE_API_BASE_URL` rechaza HTTP remoto.
4. Login envía `identifier`, `credentials: include`, `Content-Type`, `X-Auth-Client: WEB` y `X-Client-Instance-Id`.
5. Password, access token, CSRF y roles no se persisten. Solo se conserva el identificador de instancia y el marcador no sensible de logout pendiente.
6. El error de autenticación conserva mensaje genérico. La implementación usa el modal accesible compartido, con foco controlado y cierre por Escape, en vez de la alerta inline dibujada en el mockup de estados; QA debe aceptar expresamente esta desviación visual o solicitar alineación.

## Matriz criterio → evidencia de Desarrollo

| Criterio | Evidencia vigente |
|---|---|
| Valida campos | `App.test.tsx` y `useLoginForm`; validación de identificador y contraseña |
| Error genérico | Respuesta uniforme, limpieza de contraseña y diálogo accesible |
| No expone contraseña | Campo oculto por defecto; credenciales no se persisten ni registran |
| Redirige según rol | Pruebas de rutas contractuales y rechazo de sesión inválida |
| HTTP local opcional seguro | `vite.config.test.ts` y `api.test.ts`: loopback permitido; HTTP remoto rechazado; certificado HTTPS remoto validado |

## Evidencia vigente

- Frontend: `npm test` — 24/24 PASS; `npm run build` (incluye typecheck) — PASS. Lint permanecía PASS antes del delta dirigido.
- Backend/integración compartida: `mvn --batch-mode --no-transfer-progress clean verify` — 344 pruebas, 0 fallos, 5 omitidas, PASS.
- CI del commit base `4c30919…`: `Backend EN-011 Closure CI`, run `31409443631`, job `93523686904` — SUCCESS. El delta Frontend tiene equivalente local en PASS.
- `git diff --check` — PASS.

## Gates

- QA Frontend: `PASS` sobre `HEAD 4c30919ff7f676292df295229a6aeb0d8769cd69 + diff 12456f0f`; prueba dirigida 5/5 y suite completa 24/24. Acepta el modal accesible como desviación visual no bloqueante.
- Seguridad: `PASS` sobre el mismo Candidate-ID; `SEC-FE001-01` cerrado mediante validación de certificados HTTPS remotos, excepción limitada a loopback y rechazo de HTTP remoto.
- DoF autorizado sobre el mismo candidato; no debe repetir suites.

## Exclusiones del candidato

- Cambios locales de `CompanyUserController`, `CompanyUserService` y `backend/.idea/compiler.xml` no pertenecen a FE-001.
- `docs/frontendMockups/FE-001-login-states-v2.html` permanece no rastreado y no es referencia aprobada. Debe decidirse por separado si reemplazará al mockup vigente.
