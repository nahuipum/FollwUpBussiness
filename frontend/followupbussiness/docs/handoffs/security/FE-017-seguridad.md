# FE-017 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `359cc48+fe017-6cb5b17e4336`

## Superficie revisada

Publicación y reordenamiento de rutas, autorización Admin/Supervisor, alcance de vendedor, aislamiento tenant del snapshot y fallback N-1, atomicidad de publicación, códigos 409, sesión/CSRF/idempotencia y payloads de auditoría/outbox/logs.

## Resultado y evidencia

- **PASS — autorización y tenant:** `PublishRouteService` y `ReorderRoutePointsService` exigen `COMPANY_ADMIN`/`SUPERVISOR`, cargan la ruta con `actor.tenantId()` y validan la cartera antes de snapshots o escrituras. Las pruebas afectadas verifican que un Supervisor fuera de alcance no reserva idempotencia ni toca snapshot, auditoría u outbox.
- **PASS — fallback controlado:** solo se consulta el snapshot `VALID` de la versión actual y, para una ruta `PUBLISHED` heredada, el predecesor exacto `N-1`, siempre con `tenantId` y `routeId`. Se revalidan vigencia y permutación completa antes de escribir; no existe selección de snapshot arbitrario.
- **PASS — atomicidad:** `RoutingConfiguration` ejecuta publicación y reordenamiento en `TransactionTemplate` con aislamiento `SERIALIZABLE`; ruta, copia/supersesión del snapshot, auditoría, outbox e idempotencia participan en la misma operación.
- **PASS — exposición mínima:** los 409 publican únicamente códigos enum permitidos y `correlationId`; los logs contienen código y correlación, no cuerpos, credenciales ni datos personales. Los eventos incluyen solo IDs técnicos, versión, fecha operativa y `notifySeller`.
- **PASS — sesión y credenciales:** mutaciones usan Bearer en memoria, CSRF, `If-Match`, idempotencia y correlación. El cambio de sesión/tenant aborta o invalida respuestas pendientes y limpia selección y clave.

## Abuso dirigido

`NOT_EXECUTED`: el intento de ejecutar `PublishRouteServiceTest#deniesSupervisorOutsideCurrentSellerScopeBeforeIdempotencyOrWrites` no inició por fallo del wrapper Maven (`Cannot start maven from wrapper`). Se reutiliza la evidencia Development/QA del mismo candidato.

## Controles no aplicables y riesgo residual

No se afectaron secretos persistidos, archivos, WebSocket, cache/Redis, pagos ni dependencias. Riesgo residual bajo: no se repitió una prueba de integración real de rollback transaccional; la conclusión se apoya en configuración y pruebas focales ya aprobadas.
