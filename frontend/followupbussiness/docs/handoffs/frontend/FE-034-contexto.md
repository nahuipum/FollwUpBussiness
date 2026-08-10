# FE-034 — Contexto único de orquestación

Estado de entrada Development: `READY_FOR_HANDOFF`. Candidate-ID: se calcula una única vez al terminar Development. No usar Graphify ni modificar contratos, Backend ni mockup.

## Alcance y criterios

Uniformar en la web los errores HTTP `401`, `403`, `404`, `409`, `422` y `500`: mensaje claro y seguro, acción contextual recuperable, sesión vencida y `correlationId` visible. Backend sigue siendo la autoridad de autorización; la UI no concede acceso. Al logout, expiración o sustitución de usuario/empresa se deben eliminar estado, caché/datos derivados, errores y permisos anteriores.

Invariantes: (1) error visible sin detalle sensible; (2) acción recuperable contextual; (3) `401` limpia sesión/caché y usa el flujo existente sin bucle; (4) `403` informa sin sustituir autorización Backend; (5) cambio de usuario/tenant no conserva errores, datos ni permisos previos.

## Contratos mínimos

OpenAPI (`docs/api/openapi.yaml`, respuestas y `components/schemas/ErrorResponse`): los seis estados usan `application/problem+json`; `500` es interno sin detalles sensibles. `401` significa identidad ausente/inválida/sesión revocada; `403`, identidad sin operación/recurso; `404`, recurso inexistente en alcance visible; `409`, conflicto de estado/versión/idempotencia; `422`, regla de negocio incumplida. El esquema exige `type`, `title`, `status`, `code`, `correlationId`; puede incluir `detail`, `instance` y hasta 100 `fieldErrors` (`field`, `code`, `message`). Solo usar mensajes/errores de campo bajo política segura; nunca exponer `detail`, `instance`, payload, stack, tokens, cookies, correo, tenant o roles.

`correlationId`: preferir cabecera `X-Correlation-Id`; como respaldo, cuerpo problem `correlationId`. Es cadena 1–100. Puede mostrarse y copiarse solo en memoria/UI; no persistirla. Propagarlo en solicitudes solo cuando sea seguro y aplicable, sin sobrescribir la semántica de autenticación existente ni registrar secretos.

## Superficie existente y diseño a preservar

Mockup existente confirmado: `../../docs/frontendMockups/FE-034-global-errors-permissions-ui-kit.html`; componentes visuales ya creados: `src/features/error-ui/components/{InlineAlert,SessionExpiredDialog,ErrorState,CorrelationId}.tsx` y estilos. Reutilizarlos sin rediseño ni editar mockup.

Transporte: `src/lib/api.ts` (`apiRequest`). Sesión: `src/features/auth/auth.ts`: memoria para token/CSRF/roles/usuario, `clearSession`, `refreshSession`, `logout`, suscripción y generación contra carreras. Ruteo/sesión: `src/app/hooks/useSessionRoute.ts`, `src/app/App.tsx`, `src/app/navigation.ts`; `InvalidSessionDialog` ya implementa el patrón de expiración. Pruebas cercanas: `src/lib/api.test.ts`, `src/features/auth/auth.test.ts`, `src/app/App.test.tsx`, `src/features/error-ui/components/ErrorUi.test.tsx`.

## Mapeo de UI permitido

`401`: limpiar y dirigir al flujo existente de sesión vencida, una vez. `403`: `ErrorState forbidden`, volver a área segura/inicio. `404`: `ErrorState not-found`, volver. `409`: `InlineAlert warning` y acción contextual (recargar/revisar), sin repetir mutación automáticamente. `422`: alerta/formulario con `fieldErrors` seguros y asociables; genérico si no son confiables. `500`: `ErrorState temporary`, reintento explícito solo de operación segura. Para cada uno, mensaje genérico localizado y `correlationId` secundario.

## Riesgos, controles y pruebas previstas

Riesgos: filtración de problem detail; bypass visual de permisos; bucle `401`; estado residual entre identidades/empresa; reintentos inseguros. Controles: normalizador tipado y allowlist de campos/mensajes; estado efímero centralizado; un único disparo de expiración; limpieza por cambio de sesión; no persistencia/telemetría sensible. Development cubre los seis estados, `401` sin bucle/limpieza, `403` sin bypass, cambio usuario/tenant, typecheck y CI equivalente por afectar transporte/sesión/composición. QA valida criterios y negativo; Security reproduce un abuso `401` o cambio de identidad.
