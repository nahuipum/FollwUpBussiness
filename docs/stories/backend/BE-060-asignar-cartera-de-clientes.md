# BE-060 — Asignar cartera de clientes

**Área:** Backend
**Tipo:** Historia de usuario
**Épica:** Clientes
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** asignar o reasignar clientes a un vendedor
**Para** definir la cartera sobre la que se planifican rutas y se mide cobertura

## Alcance

Asignación individual y masiva dentro de una empresa, conservando historial de
responsables.

## Criterios de aceptación

1. Cliente y vendedor pertenecen al mismo tenant y están activos.
2. La operación masiva es atómica o reporta de forma explícita cada rechazo,
   según el contrato aprobado.
3. Se conserva responsable anterior, nuevo responsable, fecha, actor y motivo
   de reasignación.
4. Los filtros, sugerencias de frecuencia y creación de rutas reflejan la
   cartera vigente.
5. Una reasignación no modifica visitas, ventas ni rutas históricas.

## Fuera de alcance

- Reasignar rutas ya publicadas; corresponde a BE-025.
- Asignación automática por inteligencia comercial.

## Referencias

- Flujo 12.1
- RF-CLI-001
- RN-002
- RN-013

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-013` — Registrar cliente; `BE-059` — Listar y consultar vendedores; `BE-062` — Gestionar zonas y territorios
- **Historias consecuentes que habilita:** `BE-021` — Crear ruta manual; `BE-027` — Sugerir clientes por frecuencia; `FE-008` — Listado y filtros de clientes; `FE-036` — Asignar cartera de clientes; `INT-034` — Asignación de cartera E2E
- **Validación vertical:** `INT-034` — Asignación de cartera E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/customers`; modelo PostGIS, filtros y asignación de cartera.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Cliente, dirección, punto PostGIS, estado, zona, vendedor responsable e historial de asignación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, coordenadas erróneas, asignación desactualizada y BOLA.

## Fuera de alcance

- CRM omnicanal, cobranzas y geocodificación aceptada sin confirmación.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
