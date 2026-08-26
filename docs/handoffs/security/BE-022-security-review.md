# BE-022 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `db27cc3+4ec4aabeae61` (coincide con paquete, Development `READY_FOR_HANDOFF` y QA `PASS`).

## Superficie revisada

`POST /routes/optimize`: autenticación, rol/scope/tenant, asociación ruta–vendedor/fecha, cartera/territorio, cuota 35 por tenant/cuenta/día, minimización de ubicación hacia Matrix, errores, persistencia concurrente y no publicación. Se revisaron únicamente el delta productivo, migración y pruebas afectadas; se reutilizó la evidencia Dev/QA del mismo candidato.

## Resultado y evidencia

- `PASS` — La ruta `DRAFT`, su vendedor y fecha se validan antes de cuota, Matrix y persistencia; las denegaciones verifican ausencia de esos efectos.
- `PASS` — `JdbcMatrixQuota` ejecuta la reserva atómica con `PROPAGATION_REQUIRES_NEW`; queda confirmada aunque Matrix o la transacción exterior fallen. Reproducción de abuso ejecutada: `mvn -q '-Dtest=JdbcMatrixQuotaIntegrationTest#matrixFailuresDoNotReturnQuotaAndThirtySixthCallNeverReachesMatrix' test` — `PASS`. Tras 35 fallos `Unavailable`, el contador permanece en 35, no hay propuestas y la llamada 36 devuelve `RateLimited` antes de Matrix.
- `PASS` — El controlador responde `503 PROVIDER_RATE_LIMITED`/`PROVIDER_UNCONFIGURED`, `Retry-After` y `CorrelationId`, sin cuenta, coordenadas, matriz, secretos ni detalles internos.
- `PASS` — Tenant, Admin/Supervisor, scope, vendedor, territorio y cartera permanecen previos al proveedor. `TravelMatrix` recibe exclusivamente `List<GeoPoint>` WGS84. No se añadieron logs, métricas, auditoría sensible, outbox o eventos; la propuesta sigue `published=false` y la ruta no se modifica.

## Hallazgos y riesgos residuales

Sin hallazgos abiertos. Controles no aplicables: WebSocket, Redis/cache, mensajería, archivos y dependencias/infrastructura externa nueva.

`NOT_EXECUTED`: Mapbox y OR-Tools productivos por ausencia de credenciales/provisión. Riesgos residuales aceptados: disponibilidad/coste del proveedor, validación live de sus respuestas y contención de locks bajo carga.
