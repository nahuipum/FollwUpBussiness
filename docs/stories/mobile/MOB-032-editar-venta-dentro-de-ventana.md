# MOB-032 — Editar venta dentro de ventana

**Área:** Mobile
**Tipo:** Historia de usuario
**Épica:** Ventas
**Prioridad:** Should Have
**Fase:** MVP condicionado

## Historia

**Como** vendedor autorizado
**Quiero** corregir una venta dentro del periodo permitido
**Para** subsanar un error sin perder trazabilidad

## Alcance

Edición de ventas propias confirmadas o pendientes, respetando la ventana y el
contrato de sincronización.

## Criterios de aceptación

1. Solo se ofrece la acción para una venta propia, vigente y editable.
2. La aplicación muestra el límite de edición y conserva el valor anterior.
3. Los totales se recalculan localmente para UX y el servidor los vuelve a
   calcular como autoridad.
4. La edición offline usa un comando idempotente referenciado a la venta
   original y no crea otra venta.
5. Ventana vencida, jornada cerrada, venta anulada o conflicto muestran una
   respuesta accionable sin perder datos.

## Fuera de alcance

- Editar ventas de otros vendedores o reabrir una venta anulada.

## Referencias

- RN-012
- RF-VTA-005

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-043` — Editar venta dentro de ventana; `EN-015` — Definir persistencia local y sincronización móvil; `MOB-022` — Sincronizar venta idempotente; `MOB-023` — Consultar ventas propias del día
- **Historias consecuentes que habilita:** `INT-037` — Edición de venta E2E
- **Validación vertical:** `INT-037` — Edición de venta E2E

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
