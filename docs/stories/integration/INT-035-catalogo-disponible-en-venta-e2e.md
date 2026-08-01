# INT-035 — Catálogo disponible en venta E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Ventas
**Prioridad:** Should Have
**Fase:** MVP condicionado al modelo de venta detallada

## Historia

**Como** administrador y vendedor
**Quiero** publicar un catálogo y usarlo offline en una venta
**Para** registrar ventas con productos vigentes y trazables

## Alcance

Validar administración web, consulta/snapshot móvil, uso offline,
sincronización de venta e histórico de productos.

## Criterios de aceptación

1. El administrador crea o actualiza productos desde el panel.
2. El móvil sincroniza el catálogo y muestra su última actualización.
3. Un producto inactivo no se ofrece en ventas nuevas, pero permanece en el
   histórico.
4. La venta offline conserva producto, cantidad y precio de referencia; el
   servidor recalcula según el contrato.
5. No se mezclan productos de empresas diferentes.

## Dependencias

- BE-041, FE-035, MOB-019, MOB-021 y MOB-022.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-041` — Gestionar productos; `FE-035` — Gestionar catálogo de productos; `MOB-019` — Consultar catálogo offline; `MOB-021` — Registrar venta detallada; `MOB-022` — Sincronizar venta idempotente
- **Historias consecuentes que habilita:** No tiene sucesora directa; su cierre alimenta la regresión y el DoF del MVP.
- **Validación vertical:** Esta historia es la validación vertical E2E y constituye la puerta de salida de su capacidad.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/sales`; eventos `sale.*`; comando sync `sale.create`.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Venta, cliente, vendedor, visita, moneda, detalle/concepto, importes calculados, estado e idempotency key.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: totales manipulados, duplicados offline, catálogo obsoleto y anulación no auditada.

## Fuera de alcance

- facturación electrónica, pagos, cobranzas y eliminación física.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
