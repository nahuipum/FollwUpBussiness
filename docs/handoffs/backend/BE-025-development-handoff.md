# BE-025 — Handoff de Development

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `6e32542+f45de4cde9c4`

Implementado `POST /routes/{routeId}/reassign` en Routing con `If-Match`,
`Idempotency-Key`, respuesta con ETag/correlación, actualización optimista,
auditoría y outbox `route.reassigned` v1. El motivo es validado y se omite de
auditoría/evento por política de texto libre.

Remediación QA: se retiraron por completo el puerto, adaptadores, wiring y
migración provisionales de Visits (`route_visit`). La reasignación admite solo
`PUBLISHED`; `DRAFT`, `IN_PROGRESS`, `COMPLETED` y `CANCELLED` generan conflicto
sin efectos. Se actualizaron `00_CONTRATO_FUNCIONAL.md`, OpenAPI y la historia.

Controles cubiertos: solo `COMPANY_ADMIN` global del tenant o `SUPERVISOR` con
vendedor actual y nuevo en su equipo; `SELLER`/cross-tenant sin efectos;
estado solo `PUBLISHED`; versión o estado incompatibles devuelven conflicto sin
escritura, audit ni evento; replay exacto no duplica efectos. Puntos, visitas
completadas, ventas y jornadas no cambian.

Archivos principales: `routing/application/ReassignRouteService.java`,
`routing/adapter/in/rest/RouteController.java`, `routing/config/RoutingConfiguration.java`
y `routing/application/ReassignRouteServiceTest.java`. Se verificó el payload
contra `docs/events/notification-contract.md`.

Pruebas: `mvn -q -Dtest=ReassignRouteServiceTest test` PASS;
`mvn -q clean verify` PASS; `git diff --check` PASS. Riesgo residual:
reasignación en ejecución queda diferida hasta que Visits implemente su propio
modelo y ciclo de vida.
