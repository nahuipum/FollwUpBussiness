# BE-025 — Informe de Security

Estado: `PASS`  
Candidate-ID: `6e32542+f45de4cde9c4`

## Superficie revisada

`POST /routes/{routeId}/reassign`: autenticación/CSRF, roles y alcance de equipo, aislamiento por `tenantId`, BOLA sobre `routeId`/`sellerId`, `If-Match`, `Idempotency-Key`, concurrencia, auditoría/outbox, evento, métricas, cabeceras y texto libre `reason`. Se abrieron únicamente las dependencias de seguridad, migraciones, auditoría y outbox para comprobar autenticación, compatibilidad de `REASSIGN` y atomicidad.

## Resultado y evidencia

- `PASS` — `COMPANY_ADMIN` queda limitado al tenant; `SUPERVISOR` requiere vendedor actual y nuevo dentro de su alcance vigente; `SELLER`, ruta ajena, vendedor ajeno/inactivo y recurso inexistente convergen sin revelación útil ni efectos.
- `PASS` — lectura y actualización incluyen `tenant_id`; `FOR UPDATE`, versión/estado y transacción `SERIALIZABLE` evitan reasignación concurrente o sobre estados distintos de `PUBLISHED`.
- `PASS` — ruta, reserva/cierre idempotente, auditoría y outbox usan el mismo contexto transaccional. Replay exacto no repite escritura, auditoría ni evento; reutilización incompatible produce conflicto.
- `PASS` — `reason` no aparece en respuesta, auditoría, evento, logs ni métricas; solo contribuye a una huella SHA-256 compuesta. Evento y cabeceras contienen únicamente identificadores técnicos esperados; errores son genéricos.
- Abuso reproducido: `ReassignRouteServiceTest#deniesSupervisorWhenEitherSellerIsOutsideCurrentTeamBeforeEffects` — `PASS`; deniega antes de idempotencia y sin mutación/auditoría/outbox. Se reutilizan QA focalizado y `clean verify` del mismo candidato.

Hallazgos: ninguno.

No aplican secretos, almacenamiento local, WebSocket, Redis/cache, archivos, pagos, cambios de dependencias o infraestructura. Riesgo residual: reasignación `IN_PROGRESS` permanece diferida hasta existir ciclo de vida de Visits; la huella de `reason` conserva riesgo bajo de inferencia ante compromiso de base de datos.
