# BE-014 — Handoff Desarrollo

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `HEAD b438de1 + diff BE-014 final (PATCH clientes, validación GeoPoint y evidencia tenant/rol)`.

## Alcance y evidencia

Se implementó `PATCH /customers/{customerId}` en clientes: `CustomerController`, `UpdateCustomerService`, `CustomerStore` y `JdbcCustomerStore`. La lectura y escritura filtran `tenant_id`; el `If-Match` se valida y la actualización usa versión optimista. Se mantiene WGS84/SRID 4326, se verifica territorio activo del tenant y la auditoría sólo registra anterior/nuevo de `status`, sin PII. No hubo migraciones ni cambios de contrato.

Pruebas focalizadas aprobadas: `CustomerControllerTest` y `UpdateCustomerServiceTest`. Añaden evidencia de admin A contra cliente B: `404` genérico sin PII y sin consulta B/escritura/auditoría; y supervisor propietario: `403` antes del store, sin efectos. `git diff --check` PASS. Se reutiliza `clean verify` PASS previo: este delta sólo modifica pruebas.

Cobertura: parche estricto y correlación HTTP; admin/tenant, 404 y 409 sin escritura/auditoría; territorio activo, WGS84/SRID 4326, actualización atómica y auditoría sólo de estado. La remediación hizo no final el servicio para que Spring mantenga `@Transactional`. Sin migraciones ni cambios de contrato. Riesgo restante: QA debe validar HTTP integrado y casos negativos completos.
