# Estado de preparación de contratos

**Resultado de la revisión REST:** `READY_FOR_HANDOFF`

Las HUs quedaron funcionalmente secuenciadas y `docs/api/openapi.yaml` 1.0.0
define el contrato REST general del MVP: autenticación, seguridad global,
autorización por rol, requests/responses tipados, error común, paginación,
control optimista, idempotencia y operaciones para los flujos web y mobile.

El contrato queda listo para handoff, no aprobado. QA, Ciberseguridad y DoF
deben revisarlo antes de declararlo `PASS` o usarlo como baseline congelada.
La trazabilidad detallada está en `docs/api/TRACEABILITY.md`.

## Cobertura requerida por capacidad

| Capacidad | Cobertura REST 1.0.0 | Evento/tiempo real/sync | Puerta restante |
|---|---|---|---|
| Identidad/plataforma | Completa | Revocación/activación auditada | QA y seguridad |
| Workforce | Completa | Eventos solo si existe consumidor confirmado | QA |
| Clientes/cartera | Completa | Proyecciones de reasignación | QA |
| Importación | Completa | `customer.import.*`, retry y DLQ | Contrato de eventos |
| Rutas | Completa | Publicación/reasignación y versión móvil | Eventos/push |
| Configuración | Completa | Invalidación/versionado de configuración | Sync |
| Jornada/tracking | Completa | `journey.*` y ubicación/estado por WebSocket | WebSocket |
| Visitas | Completa | `visit.*`; payloads REST reutilizados en sync | Eventos/sync |
| Catálogo/ventas | Completa, incluida venta detallada y edición | `sale.*`; create/update offline | Eventos/sync |
| Reportes/auditoría | Completa | Proyecciones alimentadas por eventos | KPI y eventos |

## Elementos comunes obligatorios

El contrato REST 1.0.0 ya incorpora:

1. `operationId`, tags, seguridad y autorización por recurso.
2. Request/response tipados sin datos sensibles.
3. Error común para 400/401/403/404/409/422/429/500 con `correlationId`.
4. Paginación, filtros, orden estable y zona horaria.
5. `Idempotency-Key` o identificador generado por cliente en comandos móviles.
6. Money decimal, fechas ISO 8601 y puntos geográficos con precisión/SRID
   documentados.
7. Ningún `tenantId` del payload se acepta como autoridad.

Antes de cerrar eventos, WebSocket y los detalles internos de sync:

1. Envelope, versión, owner, productor, consumidores y esquema del payload.
2. Autorización por tenant/equipo, orden temporal y replay.
3. Idempotencia, retry/backoff/DLQ y correlation/causation ID.
4. Compatibilidad de versiones y estrategia de despliegue.

## Orden de revisión y adopción

1. Backend QA revisa implementabilidad, reglas, estados e idempotencia.
2. Frontend QA y Mobile QA validan que los flujos no tengan vacíos.
3. Ciberseguridad revisa identidad, aislamiento, GPS y datos personales.
4. DoF decide si 1.0.0 puede fijarse como baseline.
5. Backend publica el artefacto aprobado y los clientes se regeneran desde esa
   versión, nunca desde cambios no aprobados en la rama.

