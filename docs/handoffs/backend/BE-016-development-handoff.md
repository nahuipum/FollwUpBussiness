# BE-016 — Desarrollo backend

**Estado:** `BLOCKED`  
**Candidate-ID:** pendiente; no se modificó código.

## Alcance revisado

`GET /customers` con alcance por tenant, rol, equipo/cartera y filtros combinables.

## Bloqueo

La implementación segura no es posible con el modelo persistido actual. [V28__create_customers.sql](../../../backend/followupbussiness/src/main/resources/db/migration/V28__create_customers.sql) solo define `customer` y `territory_id`; no hay persistencia de asignación cliente-vendedor, segmento, visitas ni compras. Las migraciones existentes terminan en V28 y la búsqueda de `customer_id`, asignaciones y `seller_id` no encuentra una relación de cartera ni historial. Por ello no se pueden imponer antes de filtros/conteo/paginación los permisos obligatorios de `SELLER` y `SUPERVISOR`, ni ejecutar fielmente `sellerId`, `segment`, `withoutVisitSince` y `withoutPurchaseSince`, sin inventar relaciones o reglas fuera de alcance.

## Puertos y seguridad

No se añadieron puertos ni se alcanzaron escrituras, auditoría o eventos. El contrato OpenAPI se mantuvo intacto. La ausencia afecta controles BOLA/IDOR, aislamiento de tenant/equipo/cartera y filtros temporales.

## Verificación

- `git diff --check`: correcto.
- No se ejecutaron pruebas ni `clean verify`: no existe un cambio implementable que validar.

## Cierre requerido / reproducción

Completar `EN-021` para definir y proveer la relación contractual y migraciones de cartera cliente-vendedor, segmento e historial de visita/compra, incluida la fuente de fechas y semántica de exclusión. Después completar `BE-060` sobre esa base. Solo entonces implementar BE-016 con consulta de alcance en SQL antes de filtros, conteo y paginación, y pruebas de admin/supervisor/seller, tenant ajeno e inválidos 400.
