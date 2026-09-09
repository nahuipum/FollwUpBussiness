# BE-024 — Desarrollo Backend

**Estado:** `BLOCKED`
**Candidate-ID:** `a189f4d + sin diff Backend BE-024 (bloqueado antes de implementación)`

## Alcance y bloqueo

La remediación solicitada no puede capturar un `PlanningSnapshot` `VALID` para
una ruta manual sin inventar reglas. Se abrió `docs/architecture/routing/EN-022-planning-snapshot-policy.md`, líneas 24–46, porque el paquete no identificaba
los contratos públicos de las restricciones requeridas.

Evidencia: `CustomerPortfolioReadUseCase.RouteCustomer` expone solo
`id`, `location` y `territoryId`; `JourneyStartedStatusUseCase` expone solo
estado de inicio; `CreateRouteUseCase.Command` no incluye duración, ventanas ni
disponibilidad. EN-022 exige duración positiva, ventanas duras, jornada,
zona IANA y matriz completa para `VALID`. La matriz existente no cubre las
restricciones ausentes.

## Remediación mínima

Exponer puertos públicos tenant-scoped para hechos planificables de `customers`
(duración/ventanas), disponibilidad de `journeys` y zona IANA de `tenancy`;
autorizarlos y cablearlos en una transacción de `routing` con `TravelMatrix`.
Entonces persistir `VALID` solo si todas las fuentes y pares son válidos, o
`INCOMPLETE`/`FAILED` sin publicar ni emitir efectos en caso contrario.

## Archivos y verificación

Solo se actualizaron este handoff y
`docs/handoffs/governance/BE-024-context-package.md`; no hay cambios Backend,
contratos REST, eventos ni migraciones. No se ejecutó Maven ni `clean verify`:
no existe diff de código verificable. `git diff --check` — PASS.

## Criterio, riesgo y reproducción

Permanece sin cubrir la creación publicable porque el sistema carece de las
fuentes autorizadas. Reproducir: crear una ruta manual y publicar con vendedor
activo e `If-Match` vigente; `PublishRouteService` no encontrará snapshot
`VALID` y responde conflicto. Riesgo: fijar valores por defecto produciría ETA
y restricciones falsas y violaría EN-022.
