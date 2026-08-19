# FE-037 — Revisión de Seguridad

**Estado:** PASS
**Candidate-ID:** `HEAD 286ad04 + FE-037 territorios UI/rutas + assignedSellerCount + confirmación de inactivación`

## Superficie revisada

Rutas protegidas de zonas, autorización `COMPANY_ADMIN`/`SUPERVISOR`, aislamiento por `tenantId`, mutaciones con CSRF e `If-Match`, invalidación de estado/solicitudes al cambiar sesión o empresa, conteo agregado `assignedSellerCount` y errores 403/404/409.

## Resultado y evidencia

- **PASS — autorización y tenant (Alta):** la UI deja al Supervisor en solo lectura, pero el control decisivo está en Backend: `viewer/admin`; búsquedas y `UPDATE` incluyen tenant. Un ID ajeno responde 404 y no revela existencia.
- **PASS — abuso reproducido:** `TerritoryControllerTest#httpAuthorizationTenantIsolationAndRejectedEffectsAreObservable` pasó. Reprodujo escritura como Supervisor (403), ID de otro tenant (404) y versión obsoleta (409), verificando que no aumentaran escrituras ni auditorías.
- **PASS — sesión/concurrencia (Alta):** las mutaciones toman credenciales/CSRF de la sesión vigente; el cambio de generación aborta respuestas antiguas, y ambos hooks descartan resultados y limpian formulario/listado. `If-Match` conserva control optimista; doble envío queda bloqueado.
- **PASS — divulgación/entrada (Media):** `assignedSellerCount` solo expone un agregado; su consulta recibe IDs previamente acotados al tenant y filtra vendedores por tenant. Los mensajes UI son genéricos y no muestran cuerpos arbitrarios ni datos personales.

**Hallazgos:** ninguno.

## Controles no aplicables y riesgo residual

Sin cambios en secretos, ubicación/polígonos, almacenamiento local, WebSocket, Redis/cache, mensajería, archivos, dependencias o infraestructura. **NOT_EXECUTED:** prueba JDBC multi-tenant real; el SQL fue revisado y el abuso HTTP cubrió el comportamiento observable. Riesgo residual bajo: la ocultación UI no sustituye la autorización Backend, que permanece activa.
