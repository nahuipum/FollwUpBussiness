# FE-015 — Revisión de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `9e030b7 + rutas-ui-directions + dnd-kit-sortable + espaciado-visitas + botones-modal-homologados + dnd-opaque-id-remediated` (working tree).

## Superficie reabierta

Únicamente SEC-FE015-001: ciclo de `Idempotency-Key` ante respuesta ambigua y cambio de payload. Las demás superficies conservan el `PASS` previo.

## Cierre SEC-FE015-001

**Media — PASS.** La clave se conserva en memoria tras error de red o `5xx` y se reutiliza sólo para el mismo payload. Se invalida después de éxito, rechazo definitivo, cierre/cambio de sesión o cambio de fecha, vendedor o clientes. La prueba de abuso verificó dos envíos del mismo payload con igual clave tras pérdida de respuesta y un tercero, tras cambiar `customerIds`, con clave y payload nuevos.

## Controles y riesgo residual

Roles y acción limitados a COMPANY_ADMIN/SUPERVISOR; mutaciones con Bearer/CSRF, orden con `If-Match` y refresco 409; proyección sin ubicación/teléfono/dirección; IDs de punto sólo en memoria; limpieza por tenant. QA PASS revalidó el ciclo de claves. Riesgo residual: la deduplicación efectiva y aislamiento final los impone Backend. Sin cambios en secretos, WebSocket, caché, mensajería, archivos, dependencias ni infraestructura.

El delta `ui-homologada` es `NOT_APPLICABLE` para Seguridad: reutiliza `DateFilterField`, `ModalAsyncState`, `FormAlert` y `Plus`, y estabiliza una prueba de recuperación; no modifica API, idempotencia, autorización, tenant, cartera, datos ni controles sensibles.

El límite de 50 fue revalidado: la UI bloquea selección/envío superiores a 50 y Backend rechaza 51 antes de idempotencia, consultas, persistencia o auditoría. La reproducción negativa con 51 y cero efectos aprobó. No hay hallazgos abiertos.

El delta `app-401-wait` es `NOT_APPLICABLE`: modifica sólo la sincronización de `App.test` después de un 401, sin producción ni cambios en API, autorización, tenant, cartera, datos, idempotencia o límite de planificación.

El delta `fecha-programada-copy` es `NOT_APPLICABLE`: sólo aclara la etiqueta y ayuda de fecha; no modifica lógica ni controles sensibles.

El delta `footer-gap` es `NOT_APPLICABLE`: homologa únicamente el espacio visual entre botones, sin lógica ni controles sensibles.

## Revisión de mapa y orden

**PASS.** `customerName` se resuelve en lote, con tenant derivado del actor y después de autorización; sólo devuelve `id/name`. El mapa conserva ubicación únicamente en memoria/canvas y muestra marcadores numerados, sin coordenadas, nombres, IDs ni logs. El DnD intercambia índices; teclado y `aria-live` continúan disponibles. `/supervisor/routes` queda limitado a SUPERVISOR y 409 recupera la versión remota sin sobrescribirla. La reproducción de nombres autorizados para SUPERVISOR aprobó con una única consulta tenant-scoped.

Riesgo residual: el proveedor de mosaicos puede observar solicitudes de estilo/mosaicos y el viewport aproximado; no recibe GeoJSON, nombres ni IDs desde este código. Mantener su clave restringida por origen/cuota.

## Delta Directions vial

**PASS.** El cliente consulta solo el backend propio con sesión; no contiene token Mapbox. La geometría vial/ubicaciones queda en memoria y canvas, sin DOM textual, logs ni almacenamiento. `403`/`503` degradan a secuencia aproximada sin exponer payload. La generación de petición se invalida en logout/cambio de tenant y descarta respuestas anteriores. QA revalidó el abuso con una promesa pendiente; sin hallazgos técnicos. Riesgo residual: la clave pública preexistente de mosaicos sigue restringible por origen/cuota.

## Revalidación final

**Estado:** `PASS`. SEC-FE015-002 quedó cerrado: los IDs de DnD son `route-sort-N` efímeros y sólo el `Map` interno conserva la asociación opaca. La activación por teclado no expone el ID en DOM. Sin hallazgos abiertos; la consulta de advisories de `npm audit` queda no ejecutada por indisponibilidad del endpoint.
