# EN-021 — Definir modelo contractual de cartera y actividad de cliente

**Área:** Backend / Arquitectura  
**Tipo:** Enabler funcional y técnico  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Establecer la fuente de verdad durable y el contrato de lectura que necesitan la
cartera vigente y los filtros de actividad de cliente, sin adelantar la lógica
de negocio de visitas o ventas.

## Alcance

- Incorporar `segment` al contrato `Customer`, a creación y edición, con su
  persistencia y validación contractual.
- Definir y migrar la relación vigente e histórica cliente–vendedor: tenant,
  cliente, vendedor, responsable anterior/nuevo, actor, fecha y motivo.
- Definir las fuentes de fecha de última visita y última compra y la semántica
  inclusiva/exclusiva de `withoutVisitSince` y `withoutPurchaseSince`.
- Exponer puertos de lectura de cartera y actividad que apliquen tenant,
  equipo y cartera antes de filtros, conteo y paginación.
- Definir índices y pruebas de aislamiento A→B/B→A, supervisor, seller,
  ausencia de actividad y parámetros inválidos.

## Criterios de aceptación

1. `segment`, cartera vigente y su historial tienen modelo, migración
   forward-only, propietario de tenant y restricciones de integridad explícitas.
2. El contrato OpenAPI de `Customer` y sus comandos es consistente con la
   persistencia; no declara filtros ni campos sin fuente de verdad.
3. La autoridad de `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER` puede determinarse
   sin leer tablas internas de otro módulo ni aceptar tenant desde la entrada.
4. La ausencia de visitas o compras y los límites de fecha tienen una semántica
   pública verificable; BE-035/BE-036 y BE-042 serán los productores de los
   hechos que esa consulta lee.
5. BE-013/BE-014, BE-060 y BE-016 tienen una ruta de corrección compatible y
   pruebas de migración/contrato antes de volver a iniciarse BE-016.

## Fuera de alcance

- Asignar o reasignar clientes: corresponde a BE-060.
- Registrar, corregir o consultar visitas y ventas: corresponde a BE-035..040
  y BE-042..046.
- Construir la pantalla de filtros o el historial de cliente.

## Referencias

- RF-CLI-001, RF-CLI-007, RF-CLI-008, RF-CLI-009.
- HU-010, HU-012 y HU-013.
- RN-001, RN-002 y RN-013.

## Seguridad y privacidad

- El tenant se deriva de la sesión; la consulta de alcance se ejecuta antes de
  todo filtro, conteo o paginación.
- No revelar cartera, actividad, identificadores ni totales fuera del equipo o
  cartera autorizados. Logs y errores omiten PII completa y coordenadas.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera, Ola 2C.
- **Predecesoras obligatorias:** `BE-013` — Registrar cliente; `BE-011` — Asignar supervisor; `BE-059` — Listar y consultar vendedores.
- **Historias consecuentes que habilita:** `BE-060` — Asignar cartera de clientes; `BE-016` — Listar y filtrar clientes; `FE-008` — Listado y filtros de clientes; `FE-010` — Mapa de clientes.
- **Validación vertical:** `INT-034` — Asignación de cartera E2E e `INT-005` — Cliente visible en mapa.

## Puerta de Ready para las historias desbloqueadas

- Migraciones, contrato OpenAPI y puertos de lectura de cartera/actividad están
  aprobados y tienen pruebas de tenant, equipo y cartera.
- BE-060 alcanza DoF `PASS` antes de reiniciar BE-016; su asignación materializa
  la cartera vigente que aplican los roles `SUPERVISOR` y `SELLER`.
- BE-016 no implementa ni infiere reglas de asignación, segmento, visita o
  compra; consume exclusivamente las fuentes definidas por este enabler.
<!-- delivery-traceability:end -->
