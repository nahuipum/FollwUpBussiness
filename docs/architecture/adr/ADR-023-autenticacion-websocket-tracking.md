# ADR-023 — Autenticación WebSocket de tracking

**Estado:** Aceptado
**Fecha:** 2026-08-25
**Decisión autorizada por:** Luis Siancas — Owner, con delegación explícita de
la elección MVP.
**Historia:** EN-020

## Decisión

`tracking/v1` usa WebSocket nativo JSON y el upgrade presenta un ticket opaco,
aleatorio, de un uso y vida máxima de 60 segundos (nunca posterior a `access.exp`)
en `Sec-WebSocket-Protocol`; el
servidor solo negocia `tracking.v1`. El ticket se emite exclusivamente a partir
de un access JWT RS256 vigente de ADR-008. No viaja por URL, cookie, frame,
logs ni métricas, no renueva sesiones y no otorga tenant, rol o recursos.

El servidor deriva y revalida familia, cuenta, tenant, rol y recurso en el
upgrade, suscripción, snapshot y publicación. Ata cada conexión a `access.exp`,
la cierra `4401 TRACKING_ACCESS_EXPIRED` a más tardar entonces y cancela
entregas en carrera. Los clientes renovarán el access por ADR-008 y abrirán una
conexión nueva; no hay refresh dentro del socket.

## Consecuencias

Se evita exponer el access token en query string y se mantiene el refresh web
HttpOnly fuera del canal. El contrato REST debe exponer la emisión del ticket
sin aceptar tenant ni scopes del cliente; BE-029/031 y FE-020 implementarán
los controles, auditoría sanitizada y cierre fail-closed. Cambiar el subprotocolo,
transporte de credenciales o duración requiere ADR sustituto y revisión de
compatibilidad y seguridad.
