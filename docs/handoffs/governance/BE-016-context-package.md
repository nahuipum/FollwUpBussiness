# Paquete de contexto — BE-016 Listar y filtrar clientes

**Estado actual:** `READY_FOR_DEVELOPMENT`.
**Candidate-ID:** `HEAD 055bab6 + BE-016 customer-list UTC-cutoff`.

## Predecesoras verificadas

- `BE-013`: DoF `PASS` en `docs/handoffs/dof/BE-013-dof.md`; `POST /customers` y `Customer` poseen contrato estable.
- `BE-059`: DoF `PASS` en `docs/handoffs/dof/BE-059-dof.md`; consulta de vendedores/equipo estable.
- El bloqueo previo queda levantado: `BE-060` tiene DoF `PASS` y la base de cartera/actividad ya existe. No se rediscuten reglas ni contrato.

## Alcance contractual

Implementar exclusivamente BE-016: `GET /customers` de `docs/api/openapi.yaml`, `x-required-roles: COMPANY_ADMIN, SUPERVISOR, SELLER`; paginación/orden estables, `CustomerPage`/`Customer`, `correlationId` y respuestas `200`, `400`, `403`. Filtros combinables: `search`, `status`, `territoryId`, `sellerId`, `segment`, `withoutVisitSince`, `withoutPurchaseSince`. Las fechas incluyen ausencia de hecho y hechos anteriores al límite contractual UTC. No modificar contrato, permisos ni relaciones de cartera.

## Controles obligatorios

1. Tenant e identidad derivan exclusivamente de sesión y se imponen en la consulta, conteo y paginación antes de filtros.
2. `COMPANY_ADMIN`: todo y solo el tenant; todos los filtros contractuales. `SUPERVISOR`: solo cartera vigente de vendedores de su equipo. `SELLER`: solo cartera propia asignada. Ningún parámetro, ID, página o tamaño amplía ni permite inferir alcance ajeno.
3. Sin autenticación, `PLATFORM_SUPERADMIN` y demás roles: `403`, sin lectura transversal. `sellerId`/territorio inactivo, ajeno, filtros incompatibles y parámetros inválidos siguen el contrato sin enumeración.
4. Éxito: página consistente y orden estable. Vacío/denegación: sin PII, clientes, vendedores, territorios o cartera ajenos. La respuesta no incluye secretos, credenciales, asignaciones ajenas ni PII innecesaria.
5. Operación de lectura: cero escrituras, asignaciones, auditoría o eventos. Propagar `correlationId`; fallos sin PII completa, dirección o coordenadas exactas.

Puertos permitidos: actor/sesión; lectura de clientes, cartera vigente, equipo, territorios y actividad. Prohibidos: escritura, auditoría y publicación.

## Fases y artefactos

- Development: `docs/handoffs/backend/BE-016-development-handoff.md` (reemplazar estado anterior), pruebas focalizadas; ejecutar `clean verify` por superficie de autorización/consulta/persistencia.
- QA: `docs/handoffs/qa/BE-016-qa-handoff.md`; solo tras `READY_FOR_HANDOFF` y Candidate-ID coincidente.
- Seguridad aplicable (BOLA/IDOR, multiempresa, equipo/cartera, PII): `docs/handoffs/security/BE-016-security-review.md`; reproducir manipulación `sellerId`/`territoryId` para equipo y tenant ajenos.
- DoF: `docs/handoffs/dof/BE-016-dof.md`; solo tras QA y Seguridad `PASS`.

Sin commits, push, PR ni cambios fuera de BE-016.
