# FE-017 — Desarrollo Frontend

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `359cc48+fe017-6cb5b17e4336`

## Remediación entregada

- Tras 422/500, `ConfirmationDialog` permanece accesible, expone `Reintentar publicación` y conserva ruta, orden y `notifySeller`. La mutación limpia el error al reenviar y bloquea una segunda solicitud concurrente.
- 409 conserva `Cargar versión actual`; 403/404 no habilitan reintento. Se mantienen cabeceras, idempotencia, `If-Match`, CSRF y limpieza por sesión/tenant.
- La identidad final muestra ruta, vendedor y fecha legible, con y sin nombre. Se reutiliza el modal existente; foco, teclado, Escape/backdrop y estado ocupado permanecen protegidos.

## Archivos

- `src/features/company-routes/components/RoutePublishWorkflow.{tsx,test.tsx}`.
- `src/features/company-routes/hooks/useRoutePublish.test.tsx`.
- `docs/handoffs/governance/FE-017-context-package.md` y este handoff.

## Contrato, evidencia y reproducción

- Contrato sin cambios: `POST /routes/{routeId}/publish`, `X-Correlation-Id`, `Idempotency-Key`, `If-Match`, CSRF y `{ notifySeller }`. Sin endpoints, permisos ni componentes compartidos nuevos.
- `npm test -- --run …RoutePublishWorkflow… …useRoutePublish… …RouteDetailDialog… …RouteWorkspace… …useRouteDetail… …ConfirmationDialog…` — 25 OK. Cubre DRAFT, roles, vendedor activo/inactivo, sesión/tenant, 409, reintento 422/500 y doble envío.
- `npm run typecheck` — OK. `npm run lint` — 0 errores; 3 advertencias ajenas. `git diff --check` — OK tras actualizar artefactos.
- Referencia visual consultada y no modificada: `docs/frontendMockups/FE-017.html`; el modal compacto existente conserva responsive móvil y los controles de teclado.
- Reproducción: abrir DRAFT elegible, confirmar; simular 422 o 500, pulsar `Reintentar publicación` y verificar una sola mutación. Simular 409 y verificar únicamente `Cargar versión actual`.

Riesgo residual: la disponibilidad local es solo UX; Backend mantiene autorización, tenant, equipo y validación final.

## Integración corregida

- Causa: publicación elevaba la ruta a N+1 sin copiar el snapshot N; editar una ruta recién publicada fallaba con `SNAPSHOT_MISSING`, pero el controlador ocultaba el código y Frontend lo confundía con `ROUTE_VERSION_CONFLICT`.
- Cambio: publicación copia el snapshot a la nueva versión en la transacción; reordenamiento admite el predecessor N-1 solo para reparar datos publicados preexistentes y después de validar tenant, vigencia y la misma permutación. El API devuelve códigos 409 seguros y la UI muestra un estado específico para fallos de planificación.
- Pruebas: `PublishRouteServiceTest`, `ReorderRoutePointsServiceTest` y `RouteControllerTest` — 21 OK; rutas Frontend — 97 OK; `npm run typecheck` y `mvn -DskipTests package` — OK.
