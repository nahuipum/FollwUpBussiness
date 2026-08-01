# INT-037 — Edición de venta E2E

**Área:** Integración
**Tipo:** Historia de integración E2E
**Épica:** Ventas
**Prioridad:** Should Have
**Fase:** MVP condicionado

## Historia

**Como** vendedor autorizado
**Quiero** editar una venta dentro de la ventana
**Para** corregirla sin duplicarla ni alterar su auditoría

## Alcance

Validar edición mobile online/offline, API idempotente, actualización de
consultas/reportes y auditoría.

## Criterios de aceptación

1. Una edición válida recalcula el total y conserva el identificador de venta.
2. Un reintento offline no crea otra venta ni aplica dos veces el cambio.
3. Ventana vencida, jornada cerrada o venta anulada son rechazadas.
4. Reportes e histórico reflejan el valor vigente.
5. Auditoría conserva anterior, nuevo, actor, fecha y motivo cuando aplique.

## Dependencias

- BE-043, MOB-032, BE-045, BE-046 y BE-051.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-043` — Editar venta dentro de ventana; `BE-045` — Consultar ventas del día; `BE-046` — Consultar histórico de ventas; `BE-051` — Registrar acciones críticas; `MOB-032` — Editar venta dentro de ventana
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
