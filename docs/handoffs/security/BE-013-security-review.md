# BE-013 — Revisión final de Seguridad

**Estado:** `PASS`
**Candidate-ID:** `HEAD dde8160cc7cd249cb7bab8def95f700487789086 + dbb4655c`.

## Superficie revisada

Autorización de `POST /customers`, aislamiento de tenant y territorio, PII/ubicación, auditoría y atomicidad cliente–auditoría. Se revisaron paquete, handoffs, diff y código/pruebas afectados. No se abrieron fuentes primarias: no surgieron ambigüedades ni riesgos nuevos.

## Hallazgos y evidencia

**Sin hallazgos abiertos.**

- `PASS` — La creación sigue exigiendo `COMPANY_ADMIN`; el tenant proviene exclusivamente del actor autenticado. La consulta territorial exige simultáneamente `tenant_id`, `id` y estado activo.
- `PASS` — El puerto calificado `transactionalAuditEntryUseCase` usa el mismo `JdbcTemplate` que clientes; `@Transactional` mantiene ambas escrituras en una sola transacción. Se reutiliza el `clean verify` y la integración de rollback reportados `PASS` por Desarrollo/QA.
- `PASS` — Abuso reproducido: `CreateCustomerServiceTest#rejectsUnauthorizedOrForeignInactiveTerritoryWithoutWritesOrAudit`. Actor `SELLER` y territorio ajeno/inactivo fueron rechazados sin inserción ni auditoría.
- `PASS` — Los errores REST son genéricos y solo incluyen `correlationId`. La auditoría registra `status=ACTIVE`; no incorpora nombre, documento, contacto, dirección ni coordenadas. No existe logging nuevo en el diff.

## No aplicable y riesgos residuales

No cambiaron secretos, WebSocket, Redis/caché, mensajería, archivos, dependencias ni infraestructura. `NOT_EXECUTED`: Seguridad no repitió `clean verify`; reutilizó evidencia del mismo Candidate-ID. Riesgo de seguridad residual: bajo.
