# EN-022 — Revisión de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD+a189f4d EN022-5ec390c8640b`

## Superficie revisada

Carrera entre captura y settings; expiración e invalidación tenant-scoped; matriz no confiable y fragmentación; roles, `If-Match`, idempotencia, auditoría/outbox y privacidad de coordenadas. Paquete, Development y QA están en `PASS`/`READY_FOR_HANDOFF` para el mismo candidato.

## Resultado

- **PASS — concurrencia:** `JdbcCurrentCompanyQuery.findById` y `JdbcCompanySettingsStore.findActiveByTenantId` ejecutan `SELECT ... FOR UPDATE OF c` sobre la misma fila `tenancy_company` del tenant. Captura y actualización corren dentro de sus `TransactionTemplate`; el lock se conserva hasta `saveValid` o hasta update/invalidation y commit/rollback. Si captura entra primero, settings espera y luego invalida el snapshot recién guardado; si settings entra primero, captura espera y lee la configuración nueva. Ya no queda un `VALID` con jornada/timezone anteriores.
- **PASS — matriz no positiva:** `validatePart` rechaza segundos o metros `<=0` en todo par fuera de diagonal. El fallo termina en `saveIncomplete`; no existe distancia/ETA cero inventada ni publicación habilitada. La diagonal puede ser cero porque no se persiste.
- **PASS — fragmentación:** para cantidades cuyo resto produciría un singleton se usan bloques de cuatro; una visita evita el proveedor y no tiene piernas. Las demás llamadas contienen 2..10 coordenadas, y 50 visitas producen 2,450 pares dirigidos sin diagonal. Forma parcial o error deja `INCOMPLETE`.
- **PASS — controles previos reutilizados:** snapshot vencido se rechaza antes de ruta/auditoría/outbox; invalidación SQL filtra `tenant_id` y `VALID`; admin/supervisor conservan alcance servidor-side y seller es rechazado. El proveedor recibe sólo coordenadas autorizadas; no recibe tenant, IDs, nombres, direcciones, duraciones ni matriz completa, y no hay endpoint de snapshot.

## Evidencia y riesgos residuales

- Suite focal Backend y `mvn -q verify` del candidato: **PASS**, reutilizados de QA. `git diff --check`: **PASS**.
- Reproducción Security con PostgreSQL concurrente: **NOT_EXECUTED**; no existe harness de integración que observe la espera real. La intercalación abusiva se cerró por la identidad de fila/lock y los límites transaccionales inspeccionados.
- Riesgo residual: el lock tenant se mantiene durante las llamadas fragmentadas al proveedor; latencia elevada puede retrasar cambios de settings y capturas concurrentes del mismo tenant. Conviene cubrirlo con prueba concurrente y timeout/telemetría transaccional.
- No aplican al delta: secretos nuevos, WebSocket, Redis/cache, archivos, pagos e infraestructura.
