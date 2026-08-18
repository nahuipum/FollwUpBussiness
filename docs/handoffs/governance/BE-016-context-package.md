# Paquete de contexto — BE-016 Listar y filtrar clientes

**Estado actual:** `BLOCKED`.
**Candidate-ID:** Pendiente; se calculará una sola vez tras Desarrollo.

## Predecesoras verificadas

- `BE-013`: DoF `PASS` en `docs/handoffs/dof/BE-013-dof.md`; `POST /customers` y el modelo `Customer` tienen contrato estable.
- `BE-059`: DoF `PASS` en `docs/handoffs/dof/BE-059-dof.md`; consulta de vendedores/equipo disponible y estable.

## Alcance y contrato

Implementar exclusivamente `GET /customers` según `docs/api/openapi.yaml`: colección paginada, orden estable, `Customer` contractual y respuestas `200`, `400`, `403`, con `correlationId`. Filtros combinables: `search`, `status`, `territoryId`, `sellerId`, `segment`, `withoutVisitSince`, `withoutPurchaseSince`. No modificar contrato ni reglas/relaciones de cartera.

## Autorización e invariantes

- Tenant únicamente de sesión. `COMPANY_ADMIN`: todo y solo su tenant, con todos los filtros. `SUPERVISOR`: solo clientes vinculados a vendedores de su equipo vigente. `SELLER`: solo clientes propios asignados. `PLATFORM_SUPERADMIN`, no autenticado y otros roles: `403` sin lectura transversal.
- El alcance tenant/equipo/cartera se impone en la consulta antes de filtros, conteo y paginación. Ningún filtro, ID, página o tamaño amplía ni revela alcance. Vacío y denegación no enumeran recursos ajenos.
- Actor/recurso: identidad, tenant, rol, equipo/cartera. Éxito: página consistente y orden estable. Denegación: `403`, sin datos ni efectos. Parámetro inválido: `400`. Fallo/no-op: no escrituras, auditoría ni eventos; errores y observabilidad omiten PII completa, dirección y coordenadas.

Puertos alcanzables: autenticación/actor y lectura de clientes, asignaciones, equipo, territorios e historial de visitas/compras si el modelo lo exige. No deben alcanzarse puertos de escritura, auditoría ni publicación.

## Artefactos y fases

- Desarrollo: `docs/handoffs/backend/BE-016-development-handoff.md`.
- QA: `docs/handoffs/qa/BE-016-qa-handoff.md`.
- Seguridad: `docs/handoffs/security/BE-016-security-review.md`.
- DoF: `docs/handoffs/dof/BE-016-dof.md`.

Seguridad es aplicable: BOLA/IDOR, multiempresa, equipo/cartera y PII. No hay preflight: las semánticas públicas requeridas están definidas en el contrato. Sin commits, push ni PR.

## Bloqueo registrado

Desarrollo confirmó que `V28__create_customers.sql` solo persiste cliente y territorio; faltan cartera cliente–vendedor, segmento e historial de visitas/compras. Sin esas fuentes no puede imponerse alcance de `SUPERVISOR`/`SELLER` antes de filtros, conteo y paginación, ni ejecutar fielmente `sellerId`, `segment`, `withoutVisitSince` y `withoutPurchaseSince`, sin inventar reglas ni introducir riesgo BOLA/IDOR. No hubo cambios de código ni Candidate-ID. Cierre acordado: `EN-021` define contrato, migraciones y fuentes de actividad; `BE-060` materializa la cartera vigente e histórica; ambos deben alcanzar DoF `PASS` junto con `BE-011`, `BE-013` y `BE-059` antes de reanudar Desarrollo de BE-016.
