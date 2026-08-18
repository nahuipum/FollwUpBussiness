# Paquete de contexto — EN-021 Cartera y actividad de cliente

**Estado actual:** `PASS`  
**Candidate-ID:** `f31ec28+981fc69ba1af`.

## Predecesoras y alcance

`BE-013`, `BE-011` y `BE-059` tienen DoF `PASS` y contrato estable (`docs/handoffs/dof/BE-013-dof.md`, `BE-011-dof.md`, `BE-059-dof.md`). Implementar únicamente el modelo contractual durable: `segment` en Customer; cartera vigente e histórica cliente–vendedor; lectura de cartera/actividad; migraciones, puertos y OpenAPI necesarios. No implementar asignación (BE-060), productores de visitas/ventas (BE-035..040/BE-042..046), UI ni eventos públicos nuevos.

## Invariantes de control

1. Actor y tenant proceden de sesión: `COMPANY_ADMIN` ve todo su tenant; `SUPERVISOR`, sólo cartera vigente de vendedores de su equipo; `SELLER`, sólo su cartera vigente. Nunca aceptar `tenantId` de entrada.
2. La consulta aplica, en orden: tenant → equipo/cartera vigente → filtros → conteo → paginación. Rechazos/no-op no escriben, emiten, auditan ni alteran credenciales/sesiones; errores no revelan IDs, totales, cartera o actividad ajenos.
3. `segment` tiene una única fuente durable y es coherente en Customer, create/edit, validación, OpenAPI y persistencia. No inventar categorías o reglas de segmentación.
4. Cartera durable forward-only conserva tenant, cliente, vendedor, responsable anterior/nuevo, actor, vigencia y motivo; define vigente/historial, FKs/integridad/índices y prohíbe inactivos, inexistentes, no autorizados y cross-tenant.
5. PostgreSQL es autoridad. Definir fuentes contractuales de última visita/compra y semántica pública para ausencia, null, zona horaria y límites de `without*Since`; los futuros productores las materializan. Redis no es fuente.

## Límites y arquitectura

Preservar monolito modular y capas domain/application/adapter/config; domain sin Spring/JPA/transport/mensajería. Ningún módulo lee tablas/repositorios internos ajenos: puertos explícitos, contratos públicos o eventos internos aprobados. Revisar si cartera histórica cambia límite, persistencia o contrato materialmente; ADR sólo si es decisión real. Logs/métricas/evidencia omiten PII completa, coordenadas y datos no autorizados.

Superficies autorizadas: OpenAPI Customer; comandos create/edit; filtros de clientes; Customer y migraciones de cartera; contratos públicos/puertos de visitas y ventas; autorización/sesión. Puertos alcanzables: REST/contrato, caso de uso, contexto de actor, lectura pública workforce, persistencia PostgreSQL, auditoría segura; justificar todo adicional.

## Verificación y artefactos

Development: pruebas de migración/contrato, tenant A→B/B→A, Admin/Supervisor/Seller, ausencia, fechas inválidas; `HexagonalArchitectureTest`, `ModuleBoundaryTest`, focalizadas y `mvn -q clean verify`. Artefactos únicos: `docs/handoffs/backend/EN-021-development-handoff.md`, `docs/handoffs/qa/EN-021-qa-handoff.md`, `docs/handoffs/security/EN-021-security-review.md`, `docs/handoffs/dof/EN-021-dof.md`. Tras Dev, fijar una vez Candidate-ID como HEAD + digest corto. BE-060 queda habilitada; BE-016 no se reanuda hasta DoF PASS de BE-060.

## Delta — remediación tras QA

Con autorización directa, Development conectó exclusivamente el `GET /customers` existente: sesión → alcance de cartera vigente → filtros → conteo SQL → paginación, sin ampliar la respuesta ni producir escrituras, auditoría o eventos. Pruebas focalizadas PostgreSQL/Flyway, arquitectura y `clean verify` PASS. La única revalidación QA y la Seguridad aplicable cerraron PASS; DoF PASS para el mismo Candidate-ID.
