# INT-021 — Resultados por vendedor E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** ver desempeño  
    **Para** gestionar equipo

    ## Alcance

    Reporting + panel.

    ## Criterios de aceptación

    1. Monto.
2. Compradores.
3. Conversión.
4. Comparación.

    ## Referencias

    - HU-053

    ## Seguridad y privacidad

    - Validar aislamiento multiempresa de extremo a extremo.
- No liberar con hallazgos Critical o High.

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
- **Predecesoras obligatorias:** `BE-048` — Reporte por vendedor; `FE-021` — Detalle de vendedor activo; `FE-028` — Resultados por vendedor
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
