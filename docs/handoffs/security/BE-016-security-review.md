# BE-016 — Revisión final de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 055bab6 + BE-016 customer-list UTC-cutoff`.

## Superficie revisada

`GET /customers`: autenticación/roles, aislamiento `tenantId`, equipo/cartera, filtros `sellerId`/`territoryId`, conteo/paginación, PII, `correlationId` y ausencia de efectos laterales. QA previo: `PASS`; candidato coincidente; `clean verify` reutilizado: `PASS`.

## Hallazgos y abuso

- **PASS — BOLA/IDOR y multiempresa.** Un `SUPERVISOR` inyectó en `sellerId` un UUID externo al equipo/tenant, uno inactivo y uno desconocido. Todos produjeron `Forbidden` antes de `count/list`; no hubo página, total ni PII que revelaran existencia. Reproducción: `mvn -q '-Dtest=CustomerPortfolioReadIntegrationTest#rejectsCrossTenantAndInactiveOrUnknownSellerFiltersAndUsesUtcActivityBoundary' test` → `PASS`.
- **PASS — alcance persistente.** `tenant_id` precede cartera y filtros y se repite en clientes, asignaciones y actividad; `count` y `list` comparten el mismo predicado. `territoryId` solo estrecha clientes ya acotados: un territorio ajeno/desconocido devuelve vacío, sin ampliar alcance. Las FK compuestas impiden asignaciones cruzadas.
- **PASS — errores/observabilidad/efectos.** Denegaciones son `403` genérico con el mismo `correlationId` en cabecera/cuerpo, sin dirección, coordenadas ni PII. No hay logging en la ruta revisada. La evidencia QA confirma cero escrituras, auditoría o eventos.

## Controles no aplicables y riesgo residual

Secretos, WebSocket, Redis/caché, mensajería, archivos, dependencias e infraestructura: no aplican al diff. **NOT_EXECUTED:** benchmark temporal dedicado; riesgo residual bajo porque `sellerId` ajeno se rechaza antes de persistencia y `territoryId` usa el mismo plan tenant-acotado. Sin hallazgos abiertos ni condición de cierre.
