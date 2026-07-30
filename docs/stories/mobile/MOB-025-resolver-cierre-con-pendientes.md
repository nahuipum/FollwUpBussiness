# MOB-025 — Resolver cierre con pendientes

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** gestionar datos pendientes  
    **Para** evitar pérdida

    ## Alcance

    Política de cierre.

    ## Criterios de aceptación

    1. Cantidad pendiente.
2. Intenta sincronizar.
3. No elimina.
4. Estado de cierre.

    ## Referencias

    - RF-UBI-007

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

- **Sprint objetivo:** Sprint 7 — Visitas y ejecución de ruta.
- **Predecesoras obligatorias:** `MOB-010` — Mostrar conectividad y sincronización; `MOB-016` — Finalizar visita; `MOB-024` — Cerrar jornada
- **Historias consecuentes que habilita:** `INT-023` — Cierre de jornada y detención de tracking
- **Validación vertical:** `INT-023` — Cierre de jornada y detención de tracking

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/journeys`; eventos `journey.*`; reglas de tracking.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Jornada, ruta, estados, pendientes y resumen de cierre.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: doble jornada, rastreo fuera de horario y cierre con pendientes.

## Fuera de alcance

- cierre que elimine pendientes o visitas abiertas sin política.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
