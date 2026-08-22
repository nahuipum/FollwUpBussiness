# INT-034 — QA independiente

**Estado:** `PASS`  
**Candidate-ID:** `11c3909+8a9504501289`

## Cobertura y resultado

- Backend: administración, lote/idempotencia, concurrencia, BOLA/cross-tenant,
  inactivos, filtros/detalle vigentes, historial y programación futura. Una
  segunda programación devuelve `409` sin asignación, historial ni auditoría
  exitosa. Prueba Maven focalizada (servicio, controlador e integración
  PostgreSQL) correcta.
- Frontend: contratos individual/lote, límite 1000, roles/ruta, estados de
  carga/error/forbidden/conflict/stale, presentación sin N+1 y cambio de
  empresa sin exposición de datos previos. Vitest focalizado: `40 OK`;
  typecheck correcto.
- Rutas se excluyen correctamente de esta candidata; la integración queda en
  `INT-041` Sprint 4.

## Hallazgos y riesgo

No hay hallazgos reproducibles. La validación CI-equivalente posterior
`mvn -q clean verify` terminó correctamente, incluida V37 en PostgreSQL.

Procede Seguridad obligatoria por autorización, tenant, clientes, ubicación e
historial.
