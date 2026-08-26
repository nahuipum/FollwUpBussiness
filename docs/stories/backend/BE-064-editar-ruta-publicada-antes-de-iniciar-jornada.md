# BE-064 — Editar ruta publicada antes de iniciar jornada

**Área:** Backend  
**Tipo:** Historia de usuario  
**Épica:** Rutas  
**Prioridad:** Should Have  
**Fase:** MVP condicionado por operación del piloto

## Historia

**Como** administrador de empresa o supervisor autorizado  
**Quiero** modificar el orden de una ruta publicada antes de que inicie la jornada  
**Para** resolver un cambio operativo y mantener informado al vendedor

## Alcance

Extiende la edición de orden para una ruta en estado `PUBLISHED`, conservando exactamente sus puntos y su vendedor. Actualiza orden, estimaciones y versión; emite `route.modified` al vendedor afectado mediante outbox transaccional. La fuente de estimaciones reutiliza el snapshot de planificación autorizado, sin tráfico en tiempo real, proveedor nuevo ni fallback silencioso.

## Criterios de aceptación

1. `COMPANY_ADMIN` modifica una ruta `PUBLISHED` de su tenant; `SUPERVISOR` solo la de vendedores de su equipo vigente.
2. La solicitud es la permutación completa de los puntos actuales; duplicados, faltantes, extras o ajenos se rechazan sin efectos.
3. Con `If-Match` vigente se recalculan estimaciones desde el snapshot aprobado, se incrementa la versión y no cambia cliente, vendedor, fecha, territorio, estado ni ejecución.
4. `IN_PROGRESS`, `COMPLETED` y `CANCELLED` se rechazan sin alterar planificación ni historial.
5. Una versión obsoleta devuelve `409`; una ruta ajena o fuera de equipo no filtra información ni genera efectos.
6. Ruta, puntos, versión, auditoría y outbox `route.modified` se confirman atómicamente; el vendedor afectado es el destinatario mínimo.
7. La notificación es genérica y Mobile usa la versión para refrescar tras autenticación; no contiene clientes, direcciones, coordenadas, tokens ni payload completo.

## Referencias

- RF-RUT-004
- RF-RUT-007
- `route-notification/v1`

## Seguridad y privacidad

- Tenant, identidad, rol y alcance de equipo se derivan de sesión; `routeId` y puntos no conceden acceso.
- Denegaciones, conflictos y fallos de recálculo/outbox no producen escritura parcial, auditoría de éxito ni notificación.
- Logs, métricas, auditoría y eventos omiten datos personales, coordenadas, tokens y payloads completos.

## Observabilidad

- Propagar `CorrelationId` a auditoría y outbox.
- Medir resultado, latencia y versión, sin identificadores de negocio como etiquetas ni datos sensibles.

## Evidencia mínima para DoF

- Pruebas de autorización tenant/equipo, permutación, estados no editables, `If-Match`, rollback de estimación/outbox y destinatario único.
- Contrato REST/evento y sincronización Mobile verificados; QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 4 — Planificación y entrega de rutas, después de publicación y notificaciones.
- **Predecesoras obligatorias:** `BE-023` con snapshot de planificación disponible; `BE-024` — Publicar ruta; `BE-053` — Notificar ruta publicada o modificada.
- **Historias consecuentes que habilita:** `MOB-029` — Recibir ruta asignada o modificada; `BE-061` — Consultar rutas y ruta del día.
- **Validación vertical:** ampliar `INT-007` con modificación publicada, aviso y refresco por versión.

## Contratos y superficies

- Reutiliza `PUT /routes/{routeId}/points/order`, `ReorderRoutePointsRequest`, `If-Match` y `route.modified` v1; antes de desarrollar se debe actualizar explícitamente OpenAPI para declarar la transición `PUBLISHED` permitida.
- No se cambia el envelope `route-notification/v1`: ya define al vendedor afectado como destinatario mínimo de `route.modified`.

## Fuera de alcance

- Modificar rutas `IN_PROGRESS`, `COMPLETED` o `CANCELLED`; añadir/eliminar clientes; reasignar; publicar; notificar por canales alternos; optimizar automáticamente; tráfico en tiempo real; edición local Mobile.

## Puerta de Ready para esta historia

- Snapshot de planificación y recálculo determinista disponibles para la ruta publicada.
- Outbox, deduplicación, entrega y refresh por versión de `route.modified` disponibles y probados.
- Matriz de efectos transaccionales y reglas de transición de estado preparadas.
<!-- delivery-traceability:end -->
