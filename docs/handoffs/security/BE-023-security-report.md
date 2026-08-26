# BE-023 — Reporte de Seguridad

**Veredicto:** `PASS`  
**Candidate-ID:** `HEAD+ff8fac1 BE023-7f735f969c32`

## Superficie revisada

`PUT /routes/{routeId}/points/order`: autenticación y roles
`COMPANY_ADMIN`/`SUPERVISOR`, aislamiento tenant/equipo, entrada no confiable,
snapshot de planificación, persistencia transaccional, auditoría y
observabilidad. Se reutilizaron los resultados `PASS` de Development/QA para
la suite y `git diff --check`.

## Hallazgos y controles

- `PASS` — Sin hallazgos Critical/High/Medium/Low. La ruta se consulta por
  `tenant_id`; el alcance del vendedor se autoriza antes del snapshot y de toda
  mutación. Consultas, FK y unicidad ligan el snapshot a tenant/ruta/versión.
- `PASS` — Denegación sin efectos: no hay lectura de snapshot, actualización,
  nueva revisión, auditoría de éxito ni puerto de eventos/notificaciones.
- `PASS` — Auditoría registra solo versiones y cantidad de puntos; métrica y
  problemas usan nombres/correlationId sin coordenadas, PII, tokens ni IDs de
  cliente.
- `PASS` — Entrada limitada a permutación única y completa, máximo 50 IDs,
  `If-Match` positivo, estado `DRAFT` y snapshot vigente/completo. Las
  operaciones comparten transacción serializable y bloqueo.

## Abuso reproducido

`mvn -q "-Dtest=ReorderRoutePointsServiceTest#tenantOrScopeDenialDoesNotReadSnapshotWriteOrAudit" test` — `PASS`. Un `SUPERVISOR` del tenant fuera del equipo obtiene `Forbidden`; se verificó cero acceso a snapshot, escritura de ruta y auditoría. Un fallo inicial de sandbox antes de ejecutar Maven fue ambiental y no cuenta como fallo del candidato.

## No aplicable y riesgo residual

Secrets, WebSocket, Redis/cache, mensajería, archivos, dependencias e
infraestructura: no modificados. `NOT_EXECUTED`: prueba HTTP/DB integrada de
BOLA; la evidencia unitaria y el SQL tenant-scoped cubren la decisión. Riesgo
residual: la captura inicial y purga del snapshot dependen del flujo EN-022;
rutas sin snapshot se rechazan de forma segura con `409`.
