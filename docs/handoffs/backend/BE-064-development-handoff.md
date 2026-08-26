# Handoff Desarrollo — BE-064

- Estado: `READY_FOR_HANDOFF`
- Candidate-ID: `HEAD+adf01a367feb39b36ddcf4aa7f9a80a41e0207a8`

## Alcance y archivos

- Se habilita reordenamiento `PUBLISHED` previo a jornada con el guard real de `journeys`, aislado por tenant/vendedor/fecha y dentro de transacción serializable: `routing/application/ReorderRoutePointsService.java`, `routing/config/RoutingConfiguration.java`.
- Se preservan endpoint, `If-Match` y DTO, añadiendo solamente `correlationId` al comando interno para el outbox: `routing/adapter/in/rest/RouteController.java`, `routing/application/port/in/ReorderRoutePointsUseCase.java`.
- `route.modified` v1 se escribe solo para `PUBLISHED`, con vendedor técnico mínimo y sin PII. `DRAFT` no lee jornada ni escribe outbox. OpenAPI actualizado en `docs/api/openapi.yaml`; sin migración propia (se reutilizan V48/V49 de EN-023).

## Cobertura y resultados

- `ReorderRoutePointsServiceTest`: tenant/equipo, permutación/snapshot, DRAFT sin guard/outbox, PUBLISHED `NOT_STARTED`, rechazo `STARTED`/`Unavailable`, payload/outbox y ausencia de append tras fallo de auditoría para rollback.
- Concurrencia del guard: `journeys/persistence/JdbcJourneyStartGuardStoreIntegrationTest` de EN-023.
- PASS: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=ReorderRoutePointsServiceTest test` y `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' clean verify`; `git diff --check` PASS.
- QA: `PASS`. Seguridad: `PASS`.

## Riesgo residual

No se identifican bloqueos de Desarrollo en el Candidate-ID indicado.
