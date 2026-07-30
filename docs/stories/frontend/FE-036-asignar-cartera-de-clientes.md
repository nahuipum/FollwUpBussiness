# FE-036 — Asignar cartera de clientes

**Área:** Frontend
**Tipo:** Historia de usuario
**Épica:** Clientes
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador
**Quiero** asignar clientes a un vendedor
**Para** mantener la cartera operativa antes de planificar rutas

## Alcance

Asignación individual y masiva, con filtros, resumen del impacto y confirmación.

## Criterios de aceptación

1. Solo permite seleccionar clientes, vendedores y zonas autorizados/activos.
2. Antes de confirmar muestra cantidad afectada y responsable actual/nuevo.
3. Los rechazos parciales o conflictos se muestran por cliente sin éxito falso.
4. La vista se actualiza y conserva filtros luego de una operación exitosa.
5. La interfaz advierte que rutas ya publicadas no se reasignan automáticamente.

## Fuera de alcance

- Reasignación automática de rutas o territorios por algoritmo.

## Referencias

- Flujo 12.1
- RF-CLI-007

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 2 — Equipo, zonas, clientes y cartera.
- **Predecesoras obligatorias:** `BE-060` — Asignar cartera de clientes; `FE-005` — Listado de vendedores; `FE-008` — Listado y filtros de clientes; `FE-037` — Gestionar zonas y territorios
- **Historias consecuentes que habilita:** `INT-034` — Asignación de cartera E2E
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
