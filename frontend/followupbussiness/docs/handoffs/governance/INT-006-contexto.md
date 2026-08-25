# INT-006 — Paquete de contexto

**Candidate-ID:** `01589d3 + dcdce259805f`.
**Fase actual:** `READY_FOR_HANDOFF`.

## Alcance y matriz mínima

| Criterio | Evidencia disponible | Aplicación/componente |
|---|---|---|
| Plantilla/versionado | OpenAPI y `CustomerImportTemplateControllerTest` | Backend BE-018 / FE-012 |
| 202, idempotencia y resultado | OpenAPI, `CustomerImportServiceTest`, FE-012/FE-013 | Backend BE-019; Frontend |
| RabbitMQ, reintentos y DLQ | `CustomerImportRabbitMqIntegrationTest` | Backend BE-056 |
| Errores CSV y 410 | OpenAPI, `CustomerImportErrorsServiceTest`, FE-013 | Backend BE-020; Frontend |
| Persistencia y tenant/BOLA | tests del procesador/controlador y filtros tenant-scoped | Backend/PostGIS; Frontend |

## Diagnóstico

Las dependencias tienen contrato estable en `docs/api/openapi.yaml` y handoffs previos `PASS`. RabbitMQ y PostGIS de Compose están saludables. No se modificó producto, contrato, configuración ni diseño.

Pruebas focalizadas ejecutadas: Backend `CustomerImportServiceTest`, `CustomerImportProcessorTest`, `CustomerImportErrorsServiceTest`, `CustomerImportControllerTest`, `CustomerImportRequestedListenerTest` y `CustomerImportRabbitMqIntegrationTest` (`mvn -q ... test`) PASS; esta última levantó RabbitMQ real vía Testcontainers y cubrió tres reintentos TTL, cierre `FAILED`, auditoría/métrica y una DLQ. Frontend: `api.test.ts`, `useCustomerImport.test.tsx` y `useCustomerImportResult.test.tsx` PASS (17 pruebas).

El bloqueo inicial de entorno quedó resuelto: Backend/Frontend responden localmente y las credenciales se cargaron desde el `.env` raíz sin exponerlas. `tenant-session-isolation.spec.ts` PASS contra API real.

## Hallazgo INT-006-01

El supuesto INT-006-01 quedó descartado: la coordenada fue reutilizada dentro del radio PostGIS contractual de 100 m, por lo que la fila fue correctamente `DUPLICATE`. Con coordenadas, nombre y dirección únicos, el E2E confirmó `COMPLETED_WITH_ERRORS`, 1 aceptada, 1 rechazada, persistencia/listado en A, CSV seguro, `202` no bloqueante, `Location`, `correlationId` e idempotencia sin segundo trabajo.

La fuente del candidato reconstruye el `SecurityContext` del admin y la correlación desde el trabajo persistido antes de crear/auditar. La prueba de integración PostgreSQL/PostGIS `CustomerImportProcessorPersistenceIntegrationTest` valida 1 aceptada/1 rechazada sin mocks: PASS. No se cambió producción, contrato, mensajería, migraciones, transacciones ni configuración.

## Hallazgo INT-006-02

**INT-006-02 corregido y revalidado.** El scope tenant devolvía `404`, pero `ProblemDetail` sin `Content-Type` producía `500`. El controlador declara `application/problem+json`. Pruebas de servicio/controlador y `mvn clean verify`: PASS; `git diff --check`: PASS. El E2E real posterior al reinicio confirma que tenant B recibe `404` neutral para trabajo y errores de A. Cambió código Backend y pruebas, no contrato/mensajería/migraciones/configuración.

## Condición de cierre

QA Backend PASS; QA Frontend revalidado PASS tras corregir el estado 404 neutral de FE-013. Seguridad obligatoria y DoF pendientes.

Excepción conocida: `npm run lint` reporta cuatro errores preexistentes ajenos a INT-006; las 18 focalizadas, type-check, suite completa (263) y build Frontend PASS constituyen la validación CI-equivalente aplicable.
