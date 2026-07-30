# BE-046 — Consultar histórico de ventas

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** consultar ventas históricas  
    **Para** analizar comportamiento

    ## Alcance

    Consulta paginada y agregada.

    ## Criterios de aceptación

    1. Filtro periodo.
2. Acumulado/ticket.
3. Permisos.
4. Exportable.

    ## Referencias

    - RF-VTA-007
- RF-VTA-008
- RF-VTA-009
- HU-052
- HU-053

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
- **Predecesoras obligatorias:** `BE-042` — Registrar venta
- **Historias consecuentes que habilita:** `BE-017` — Consultar historial de cliente; `BE-050` — Exportar reportes; `FE-027` — Histórico de ventas; `INT-020` — Histórico por cliente E2E; `INT-037` — Edición de venta E2E
- **Validación vertical:** `INT-020` — Histórico por cliente E2E; `INT-037` — Edición de venta E2E

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
