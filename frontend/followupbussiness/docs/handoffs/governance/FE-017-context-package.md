# Paquete de contexto — FE-017

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `359cc48+fe017-6cb5b17e4336`.

## Alcance y decisión de integración

Implementar la acción administrativa de publicar una ruta existente. La remediación consulta, sin modificar ni copiar, `docs/frontendMockups/FE-017.html`: el estado de error recuperable conserva la revisión y ofrece `Reintentar`; la confirmación muestra ruta, vendedor y fecha. Mantener el flujo existente de `company-routes`; no añadir entrada de sidebar ni rehacer la experiencia.

## Contrato estable verificado

`POST /routes/{routeId}/publish`, roles `COMPANY_ADMIN` y `SUPERVISOR`; cabeceras `X-Correlation-Id`, `Idempotency-Key`, `If-Match`; body opcional `{ notifySeller }` (por defecto `true`); éxito `200 Route` actualizado. Manejar `400`, `403`, `404`, `409`, `422`, red/sesión. `notifySeller=false` solo omite el push posterior: no bloquea publicación ni `route.published`.

## Invariantes y criterios

- Mostrar/ejecutar solo para Admin o Supervisor con ruta localmente elegible; Backend mantiene tenant, rol, equipo vigente, vendedor activo, `DRAFT` y snapshot `VALID` de la versión.
- Antes del POST, confirmar nombre del vendedor, fecha operativa, estado actual y disponibilidad para el vendedor. No mostrar datos personales innecesarios.
- Generar una clave de idempotencia por intento lógico y bloquear doble envío; usar versión vigente como `If-Match`.
- En `200`, mostrar confirmación/éxito reutilizable, reflejar `PUBLISHED`, versión y datos retornados; refrescar/invalidad listado, detalle y caché.
- En `409`, informar conflicto y recargar sin sobrescribir con estado local. Las demás respuestas deben ser recuperables, accesibles y sin registros sensibles.
- Limpiar selección, solicitud activa y caché al logout/cambio de tenant. Seller no tiene acceso administrativo; el frontend no sustituye autorización Backend.

## Evidencia inicial

- Historia: `docs/stories/frontend/FE-017-publicar-ruta.md`.
- Dependencia/contrato: `docs/api/openapi.yaml` (`/routes/{routeId}/publish`, `PublishRouteRequest`) y `docs/handoffs/governance/BE-024-context-package.md`.
- Patrones a inspeccionar: FE-014/FE-015, `src/features/company-routes`, API/session/permisos, modales y pruebas adyacentes.

## Delta Development

- La disponibilidad se obtiene en el listado paginado de `/sellers` mediante `Seller.status`; se conserva junto al nombre y evita N+1. Se consultó el fragmento de `docs/api/openapi.yaml` por la ambigüedad de disponibilidad, ya que el modelo previo la descartaba.
- FE-017 incorpora confirmación, POST con `X-Correlation-Id`, `Idempotency-Key` e `If-Match`, manejo recuperable de errores y limpieza por cambio de sesión/empresa. La publicación exitosa reemplaza detalle y recarga listado.
- Ajuste visual posterior: la confirmación de publicación usa una variante compacta de 680 px, en vez del visor de 1200 px, y el checkbox adopta el patrón de confirmación existente (18 px, `accent-color` petróleo, borde y foco accesible). No cambia contrato ni comportamiento.

## Delta de remediación solicitado

- Hallazgo bloqueante: `RoutePublishWorkflow` oculta la confirmación con `confirming && !error`; tras 422/500 el mensaje pide reintentar, pero no hay acción funcional y volver a pulsar **Continuar a confirmación** no limpia el error ni reabre el diálogo.
- Cierre observable: desde la misma revisión, 422 y 500 exponen una acción accesible de reintento o reapertura inequívoca; el nuevo intento limpia el error anterior, conserva ruta/orden/`notifySeller` y ejecuta una sola mutación. 409 conserva su recarga y revisión previas.
- La confirmación final debe mostrar vendedor y fecha legible tanto con ruta nombrada como sin nombre. Reutilizar `OperationDialog`, `ModalSurface`, `ModalAsyncState` o los compartidos ya vigentes; conservar foco, teclado, Escape/backdrop y `busy`.
- Añadir pruebas explícitas de reintento 422/500, doble acción pendiente, 409, identidad vendedor+fecha con/sin nombre y regresión afectada. Verificar focales, type-check, lint aplicable, visual desktop/móvil/teclado y `git diff --check`.

## Delta de remediación aplicado

- `RoutePublishWorkflow` conserva `ConfirmationDialog` tras 422/500 y muestra `Reintentar publicación` con el error accesible. El reenvío reutiliza la mutación existente, que limpia el error y conserva ruta, orden y `notifySeller`; 403/404/409 no habilitan reintento y 409 conserva su recarga.
- La identidad final incluye ruta, vendedor y fecha `dd/MM/yyyy`, incluso sin nombre. Se conserva `ModalSurface` compartido, foco inicial, Escape/backdrop y bloqueo `busy`.
- Pruebas focales cubren 422/500, limpieza del error, doble envío pendiente, 409, identidad con/sin nombre y regresiones de DRAFT/roles/sesión-tenant. Mockup consultado: `docs/frontendMockups/FE-017.html`; no modificado.

## Delta de integración — edición posterior a publicación

- Se comprobó una brecha Backend que contradecía el flujo ya aprobado: publicar incrementaba la ruta de versión N a N+1, pero dejaba el snapshot válido en N. La edición posterior buscaba N+1, devolvía un 409 genérico y la UI lo presentaba erróneamente como concurrencia.
- Publicación ahora versiona el snapshot dentro de la misma transacción. Para datos creados antes de la corrección, la primera edición acepta únicamente el snapshot válido de N-1 y vuelve a validar vigencia y permutación completa antes de escribir; no busca snapshots arbitrarios ni cruza tenant.
- Los conflictos de reordenamiento exponen un código seguro. La UI conserva la recarga solo para `ROUTE_VERSION_CONFLICT`; planificación faltante, vencida, obsoleta o incompleta se distingue y no se presenta como “la ruta cambió”.
- Evidencia dirigida: 21 pruebas Backend (publicación, reordenamiento y controlador), 97 pruebas Frontend de rutas, type-check y empaquetado Backend sin pruebas, todos satisfactorios.

## Invariantes de la remediación

1. **Actor/recurso:** solo Admin/Supervisor y ruta `DRAFT` elegible llegan a la acción; Seller no accede. Backend conserva autoridad de tenant, equipo, rol y vendedor activo.
2. **Éxito:** cada intento válido mantiene `If-Match`, CSRF, `X-Correlation-Id`, `Idempotency-Key` y `notifySeller`; `200` actualiza listado/detalle y resultado `PUBLISHED` sin duplicados.
3. **Denegación:** 403/404 no crean una vía de reintento que eluda permisos o contexto; no hay escrituras locales, revocaciones, eventos ni exposición de credenciales/datos internos.
4. **Conflicto:** 409 conserva revisión y obliga a cargar versión vigente; no sobrescribe datos locales ni cambia su semántica.
5. **Fallo/recuperación:** 422/500 conservan la revisión y permiten un nuevo intento lógico sin envío concurrente; la clave de idempotencia se renueva solo cuando corresponde al nuevo intento, y cambio de sesión/tenant invalida respuesta, estado y claves anteriores.

## Restricciones operativas

Árbol de trabajo ya contiene cambios ajenos en layout/UI compartidos; no revertirlos ni atribuirlos a FE-017. La modificación Backend queda limitada a la brecha contractual comprobada sobre versionado del snapshot y códigos seguros de conflicto. Development deja handoff y Candidate-ID; QA, Seguridad y DoF validan ese mismo candidato.
