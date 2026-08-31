# FE-016 — Revisión de Ciberseguridad

**Veredicto:** `PASS`  
**Candidate-ID:** `b6d8d35 + ac4bee151f2b`

## Superficie revisada

Sólo el cierre del hallazgo medio sobre territorio inactivo y la puerta de candidato. Los controles previamente aprobados de rol, tenant/equipo/cartera, Mapbox server-side, correlación, logs y errores públicos no cambiaron.

## Revalidación

- `PASS`: `OptimizeRouteService` comprueba `activeTerritory(tenantId, territoryId)` antes de validar la asignación. Un territorio inactivo produce `VISIT_TERRITORY_INACTIVE`; el controlador lo limita a un 422 público y el contrato lo documenta sin identificadores.
- `PASS`: abuso reproducido con `OptimizeRouteServiceTest#inactiveVisitTerritoryIsRejectedBeforeQuotaMatrixAndPersistence`; confirmó rechazo antes de cuota, matriz Mapbox y persistencia, sin consultar después la asignación.
- `PASS`: `git diff --check b6d8d35`, sin errores; sólo advertencias de fin de línea.

## Puerta final

- `PASS`: paquete `READY_FOR_HANDOFF`, handoff QA `PASS` e informe de Seguridad coinciden en `b6d8d35 + ac4bee151f2b`. El bloqueo documental anterior queda cerrado; no se reejecutó el abuso.

`NOT_APPLICABLE`: no cambiaron WebSocket, Redis/cache, mensajería, archivos, almacenamiento local, dependencias ni infraestructura.
