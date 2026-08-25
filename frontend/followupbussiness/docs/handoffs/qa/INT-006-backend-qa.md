# INT-006 — QA Backend

**Estado:** `PASS`  
**Candidate-ID:** `01589d3 + dcdce259805f` (sin delta Backend posterior).

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| `202` e idempotencia | `CustomerImportService.create` reutiliza la solicitud idéntica y evita doble outbox | `CustomerImportServiceTest`: replay, conflicto y concurrencia PASS. |
| CSV parcial y seguro | procesador/persistencia y `csv` exponen sólo fila/código seguro | `CustomerImportProcessorPersistenceIntegrationTest` y `CustomerImportErrorsServiceTest` PASS reutilizados del candidato. |
| Rabbit retry/DLQ | listener y colas sin cambio en este delta | `CustomerImportRabbitMqIntegrationTest` (RabbitMQ/Testcontainers, tres reintentos y DLQ) PASS reutilizado del candidato. |
| Tenant B `404` | `findById(tenantId,id)` limita la consulta | `CustomerImportServiceTest` verifica ausencia para tenant ajeno: PASS. |
| Roles `403` y ProblemDetail | `authorizeGet` lanza `Get...Forbidden`; controlador traduce a `403 application/problem+json` | `CustomerImportControllerTest` verifica `403` y serialización Problem JSON: PASS. |

Comandos/evidencia: `mvn -q "-Dtest=CustomerImportServiceTest,CustomerImportControllerTest" test` PASS; `git diff --check 01589d3` PASS. Se reutiliza `mvn clean verify` y las integraciones PostGIS/RabbitMQ PASS, reportadas para el mismo Candidate-ID en el paquete/handoff.

Hallazgos reproducibles: ninguno.

Riesgo de regresión: bajo; el cambio sólo separa la excepción de lectura de la de creación y fija el tipo ProblemDetail. Riesgo residual: no se repitió localmente la integración asíncrona Rabbit/PostGIS porque el delta no toca mensajería ni persistencia; queda cubierta por evidencia verificada del candidato.
