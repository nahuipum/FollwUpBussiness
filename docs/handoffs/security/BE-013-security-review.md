# BE-013 — Revisión final de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 5702c0a + BE-013 customers/V28/PostGIS/REST/auditoría-atómica`

## Superficie revisada

Autorización de `POST /customers`, aislamiento por `tenantId`, territorio, PII y ubicación precisa, respuestas de rechazo, persistencia PostGIS y atomicidad cliente–auditoría. Se reutilizó el `PASS` de QA y su prueba transaccional; no se reabrieron fuentes primarias porque no hubo ambigüedad, contradicción ni riesgo nuevo.

## Hallazgos y evidencia

**Sin hallazgos abiertos.**

- `PASS` — `CreateCustomerService` deriva el tenant exclusivamente del actor y exige exactamente `COMPANY_ADMIN`; `JdbcCustomerStore.activeTerritory` consulta por `tenant_id`, `id` y estado activo antes de insertar.
- `PASS` — Reproducción conjunta: admin con `territoryId` ajeno obtuvo `InvalidTerritory` (422 genérico en controlador) y `SUPERVISOR` obtuvo `Forbidden` (403 genérico). Resultado observable: `territoryChecks=1`, `inserts=0`, `audits=0`. El flujo no expone ni invoca puerto de eventos.
- `PASS` — Errores contienen solo detalle genérico y `correlationId`; no hay logging en el código afectado. La auditoría exitosa usa únicamente `status=ACTIVE`, sin nombre, documento, contacto, dirección ni coordenadas. La prueba transaccional de QA confirma rollback conjunto de cliente y auditoría ante fallo de commit.

## Controles no aplicables y riesgo residual

No cambiaron secretos, WebSocket, caché/Redis, mensajería, archivos ni dependencias. `NOT_EXECUTED`: `clean verify` completo no concluyó por timeout según QA; las pruebas focalizadas y la reproducción de abuso sí pasaron. Riesgo residual bajo: la evidencia completa de CI queda pendiente, sin indicio de fallo de seguridad.
