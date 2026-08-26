# EN-022 — Paquete de contexto

**Estado:** `PASS`  
**Candidate-ID:** `HEAD+ff8fac1 EN022-docs-e8d11a6b3684` (ADR, política, OpenAPI y EN-022; excluye artefactos de handoff).

## Hechos confirmados

- PostgreSQL/PostGIS es la autoridad; Redis solo puede ser efímero. `routing` es propietario de rutas y no accede a persistencia interna de otros dominios.
- `tenant`, actor, rol y alcance de equipo se derivan de sesión. `COMPANY_ADMIN` opera en su tenant; `SUPERVISOR` solo en su equipo vigente; `SELLER` no administra rutas ni snapshots.
- La creación manual original (`POST /routes`) aceptaba 1..500 `customerIds`; EN-022 sustituye este límite por 50. El contrato de optimización de EN-018 continúa en 1..9 visitas y 11 nodos/121 elementos.
- EN-018/ADR-014 fija Mapbox Matrix estático, segundos/metros, sin tráfico ni fallback. EN-022 define su reutilización segura para 50 puntos.
- El reordenamiento ya expone `PUT /routes/{routeId}/points/order` con `If-Match`, pero solo declara errores genéricos y no el estado de snapshot. `route.modified` v1 ya transporta solo referencias técnicas y versión.
- La ruta persistida contiene puntos y coordenadas tenant-scoped; las entradas de duración de servicio, ventanas, jornada, fin y política de retención del snapshot no están cerradas para la ruta manual.

## Decisiones abiertas y bloqueo

1. **Aprobado por usuario (2026-08-25):** matriz dirigida completa de hasta 52 nodos (inicio, 50 puntos y final), durable en PostgreSQL y capturada por lotes del proveedor Matrix estático ya aceptado. Reordenar usa solo la matriz capturada. El coste/consumo de producción debe incorporarse al pricing por uso; las pruebas locales no consumen cuota productiva. Una matriz autogestionada no entra en MVP y queda como evolución cuando exista base de clientes consolidada.
2. **Aprobado por usuario (2026-08-25):** el máximo de la ruta manual pasa de 500 a 50 puntos. Requiere actualización explícita de los contratos dependientes antes de Desarrollo.
3. **Aprobado por usuario (2026-08-25):** para MVP, los insumos ETA se derivarán server-side desde contratos públicos de sus dominios propietarios; si falta una fuente autorizada, no se crea/renueva snapshot ni se confirma reordenamiento. El cliente no es fuente de autoridad.
4. **Aprobado por usuario (2026-08-25):** válido hasta el fin de la fecha operativa en zona IANA, salvo invalidación material; purga física de snapshot/caché/copias a los 30 días de vencido, reemplazado o invalidado. Auditoría saneada durante 365 días.
5. **Aprobado por usuario (2026-08-25):** si el snapshot no puede crearse, la ruta se conserva en `DRAFT`, se marca snapshot no disponible y se bloquean reordenamiento/estimaciones hasta una regeneración autorizada; no se inventan ETA ni se confirman versiones parciales.
6. **Aprobado por usuario (2026-08-25):** errores neutrales tipados de snapshot; `409` para estado/versionado, denegación sin revelación de existencia según política vigente y sin exponer `snapshotId` al cliente no autorizado.
7. **Aprobado por usuario (2026-08-25):** un reordenamiento exitoso crea atómicamente una revisión `VALID` ligada a la nueva `Route.version`, con contenido inmutable reutilizado y sin proveedor; la revisión anterior queda `SUPERSEDED`.
8. **Aprobado por usuario (2026-08-25):** la diagonal se excluye. Para permutación arbitraria, cualquier par distinto no enrutable deja el snapshot `INCOMPLETE` y bloquea reordenamiento; no se usan ceros ni aproximaciones.

ADR, contrato, OpenAPI, QA, Seguridad y DoF están en `PASS`. EN-022 desbloquea documentalmente BE-023 y BE-064; su implementación conserva sus propios gates.

## Evidencia revisada

`docs/stories/enablers/EN-022-definir-snapshot-de-planificacion-y-estimaciones-de-ruta.md`; `docs/architecture/adr/ADR-014-motor-rutas-limites-mvp.md`; `docs/architecture/routing/EN-018-route-engine-policy.md`; `docs/stories/backend/BE-021-crear-ruta-manual.md`; `docs/stories/backend/BE-023-reordenar-puntos-de-ruta.md`; `docs/stories/backend/BE-064-editar-ruta-publicada-antes-de-iniciar-jornada.md`; `docs/api/openapi.yaml`; `docs/events/notification-contract.md`; `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`; `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`; `infrastructure/monitoring/observability-standard.md`.

## Artefactos propuestos

`docs/architecture/adr/ADR-023-snapshot-planificacion-rutas-manuales.md`; `docs/architecture/routing/EN-022-planning-snapshot-policy.md`; `docs/api/openapi.yaml`; EN-022 actualizada con el límite aprobado.
