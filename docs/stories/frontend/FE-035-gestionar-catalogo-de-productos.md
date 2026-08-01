# FE-035 — Gestionar catálogo de productos

**Área:** Frontend
**Tipo:** Historia de usuario
**Épica:** Catálogo
**Prioridad:** Should Have
**Fase:** MVP condicionado al modelo de venta detallada

## Historia

**Como** administrador
**Quiero** administrar el catálogo de productos
**Para** que los vendedores registren ventas con opciones vigentes

## Alcance

Listado, alta, edición e inactivación lógica consumiendo BE-041.

## Criterios de aceptación

1. La tabla es paginada y permite filtrar por estado y búsqueda.
2. Código, nombre y precio muestran validaciones del contrato.
3. Inactivar requiere confirmación y no elimina ventas históricas.
4. Estados de carga, vacío, error, conflicto y sin permiso son accesibles.
5. El cambio exitoso actualiza la vista sin mostrar datos de otro tenant.

## Fuera de alcance

- Inventario, listas de precios avanzadas, impuestos y promociones.

## Referencias

- RF-VTA-003
- RN-013

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-041` — Gestionar productos; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `INT-035` — Catálogo disponible en venta E2E
- **Validación vertical:** `INT-035` — Catálogo disponible en venta E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/products`; reglas de vigencia y snapshot comercial.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Producto/concepto, código, nombre, precio decimal, estado y versión de catálogo.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: producto inactivo usado, precio obsoleto y borrado de histórico.

## Fuera de alcance

- inventario, almacenes, impuestos y listas de precios avanzadas.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
