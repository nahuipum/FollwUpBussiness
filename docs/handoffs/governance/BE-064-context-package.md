# Paquete de contexto — BE-064

- Estado: `READY_FOR_HANDOFF`.
- Candidate-ID: `HEAD+adf01a367feb39b36ddcf4aa7f9a80a41e0207a8`.
- Alcance implementado: `PUT /routes/{routeId}/points/order` conserva DTO REST, `If-Match`, autorización tenant/equipo, permutación completa y snapshot. Admite `DRAFT` sin notificación y `PUBLISHED` exclusivamente tras `JourneyStartedStatusUseCase.stateForUpdate(tenant, vendedor, fecha)` = `NOT_STARTED`.

## Controles y contrato

- `STARTED` y `Unavailable` del guard se rechazan sin snapshot, escritura, auditoría ni outbox; la verificación y la mutación comparten `TransactionTemplate` serializable.
- Para `PUBLISHED` se persiste `route.modified` v1 en outbox transaccional, con `routeId`, `tenantId`, versión y único `recipientTechnicalIds` del vendedor; sin PII. Si outbox está deshabilitado se rechaza antes de efectos. No cambia cliente, vendedor, fecha, territorio, estado ni historial.
- OpenAPI declara explícitamente `PUBLISHED` antes de jornada y los conflictos de guard/outbox. No hay endpoint ni modelo de jornada, proveedor/matriz, push ni Mobile nuevos.

## Evidencia

- PASS: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=ReorderRoutePointsServiceTest test`.
- PASS final: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' clean verify` sobre el mismo Candidate-ID. `git diff --check`: PASS.
- QA: `PASS`. Seguridad: `PASS`.

## Cierre

La concurrencia del triple tenant/vendedor/fecha está cubierta por la integración reutilizada `JdbcJourneyStartGuardStoreIntegrationTest`; el candidato queda listo para el handoff siguiente.
