# FE-003 — Contexto de entrega

## Estado de entrada

Desarrollo habilitado: dependencias declaradas `BE-004`, `BE-005` y `FE-001`; contrato OpenAPI marcado `READY_FOR_HANDOFF`. No se calcula `Candidate-ID` antes de cambios. Alcance: gestión de sesión WEB, no reglas de negocio del servidor.

## Criterios y contrato WEB

1. Renovar según contrato; 2. expiración redirige; 3. logout limpia cache; 4. no queda tenant previo.

`POST /auth/refresh`: WEB envía `credentials: include`, `X-Auth-Client: WEB`, `X-Client-Instance-Id` y `X-CSRF-Token`; no body. Refresh vive solo en cookie `__Host-fs-refresh` HttpOnly, Secure, SameSite=Strict y nunca entra al JSON. Éxito 200 entrega credenciales de acceso, CSRF rotado e identidad; responde no-cache/correlation. 401/403 finalizan sesión; 409 es carrera de rotación y no debe provocar bucles ni exponer sucesor. `POST /auth/logout`: limpieza local precede remoto; con access usa Bearer, CSRF y mismos headers WEB; 204 es éxito/idempotencia. Sin access reintenta solo cookie con `X-Logout-Intent: PENDING`, sin credenciales; servidor borra cookie. `GET /me` devuelve identidad/empresa/roles/permisos o 401.

## Invariantes

- Éxito: un refresh válido actualiza access, CSRF, roles e identidad de misma sesión.
- Expiración/rechazo: 401/403 o respuesta inválida limpia todo y navega a inicio una vez.
- Concurrencia: un refresh activo; 409 no reintenta en bucle ni mantiene estado viejo.
- Logout: limpieza de acceso, CSRF, identidad, roles, tenant y cache ocurre antes de red; reintento pendiente no reautentica.
- Tenant: cambio de usuario/empresa nunca reutiliza identidad, permisos ni datos cacheados previos.

## Rutas y pruebas afectadas

Producción: `src/features/auth/auth.ts`, `src/app/App.tsx`, `src/app/hooks/useSessionRoute.ts`, posible cliente `src/lib/api.ts` y navegación. Pruebas: `src/features/auth/auth.test.ts`, `src/app/App.test.tsx`, `src/lib/api.test.ts`; regresión directa FE-001: `src/app/LoginScreen.test.tsx` y flujo de login existente.

## Riesgos y límites

Cookie HttpOnly requiere `credentials: include`; CSRF no sustituye credencial. Access/token nunca en almacenamiento persistente ni logs. Limpiar cache de identidad, roles/permisos y tenant antes de logout; no confiar autorización UI. Propagar correlation si viene disponible, sin registrar PII/secreto. Fuera: diseño, mockups y pantalla nueva salvo necesidad funcional accesible.

## Dependencias

Cliente WEB actual ya conserva access/CSRF solo en memoria, usa login y logout pendiente. Falta completar refresh, reacción de expiración y limpieza ampliada. Si aparece ambigüedad, contradicción o riesgo nuevo, abrir fuente mínima y registrar motivo, ruta y sección aquí o handoff vigente.
