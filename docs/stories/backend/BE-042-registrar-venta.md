# BE-042 — Registrar venta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar venta  
    **Para** actualizar gestión

    ## Alcance

    Crear venta y detalles con idempotencia.

    ## Criterios de aceptación

    1. Asocia empresa/vendedor/cliente.
2. Visita por defecto.
3. Valida importes.
4. Servidor calcula total.
5. No duplica.

    ## Referencias

    - RF-VTA-001
- RF-VTA-002
- RF-VTA-005
- HU-050

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

    ## Observabilidad

    - Propagar correlationId cuando aplique.
    - Registrar resultado y error sin datos sensibles.
    - Añadir métrica o evento operativo en flujos críticos.

    ## Evidencia mínima para DoF

    - Implementación asociada a la historia.
    - Pruebas y evidencia.
    - Matriz criterio → evidencia.
    - QA independiente.
    - Revisión de seguridad cuando aplique.
    - Contratos y documentación actualizados.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 8 — Ventas e histórico comercial.
- **Predecesoras obligatorias:** `BE-036` — Finalizar visita; `BE-055` — Implementar outbox transaccional
- **Historias consecuentes que habilita:** `BE-043` — Editar venta dentro de ventana; `BE-044` — Anular venta; `BE-045` — Consultar ventas del día; `BE-046` — Consultar histórico de ventas; `INT-017` — Venta durante visita E2E; `INT-018` — Venta offline sincronizada; `MOB-020` — Registrar venta simple; `MOB-021` — Registrar venta detallada; `MOB-022` — Sincronizar venta idempotente
- **Validación vertical:** `INT-017` — Venta durante visita E2E; `INT-018` — Venta offline sincronizada

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
