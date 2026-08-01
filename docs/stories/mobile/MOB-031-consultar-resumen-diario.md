# MOB-031 — Consultar resumen diario

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Resumen  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** ver mi resumen  
    **Para** confirmar actividad

    ## Alcance

    Visitas, pendientes y ventas.

    ## Criterios de aceptación

    1. Con/sin venta.
2. Synced/pendiente.
3. Inicio/cierre.
4. Disponible antes de cerrar.

    ## Referencias

    - 12.6
- 18.1..18.3

    ## Seguridad y privacidad

    - Usar almacenamiento seguro.
- Rastrear solo durante jornada activa.

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

- **Sprint objetivo:** Sprint 9 — Dashboard, reportes, auditoría y estabilización.
- **Predecesoras obligatorias:** `BE-047` — Calcular dashboard diario; `MOB-023` — Consultar ventas propias del día; `MOB-024` — Cerrar jornada
- **Historias consecuentes que habilita:** `INT-022` — Dashboard diario E2E
- **Validación vertical:** `INT-022` — Dashboard diario E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI de resumen diario y semántica synced/pendiente.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Jornada, visitas, ventas y estados confirmado/pendiente con timestamp de corte.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: datos pendientes contados como confirmados y cierre prematuro.

## Fuera de alcance

- capacidades no descritas en el alcance y cambios de arquitectura sin ADR.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
