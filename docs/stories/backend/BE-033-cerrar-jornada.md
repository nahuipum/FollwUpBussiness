# BE-033 — Cerrar jornada

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Jornadas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar jornada  
    **Para** finalizar tracking

    ## Alcance

    Validar pendientes y cerrar.

    ## Criterios de aceptación

    1. Visita activa se valida.
2. Registra fin.
3. Detiene presencia.
4. Evento journey.closed.

    ## Referencias

    - RF-UBI-007
- RF-UBI-008
- RN-020

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

- **Sprint objetivo:** Sprint 5 — Jornada y tracking en vivo.
- **Predecesoras obligatorias:** `BE-028` — Iniciar jornada; `BE-029` — Recibir ubicaciones
- **Historias consecuentes que habilita:** `INT-023` — Cierre de jornada y detención de tracking; `MOB-024` — Cerrar jornada
- **Validación vertical:** `INT-023` — Cierre de jornada y detención de tracking

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/journeys`; eventos `journey.*`; reglas de tracking.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Jornada, vendedor, dispositivo, inicio/cierre, estado y ubicación inicial.
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

- control de asistencia laboral y rastreo después del cierre.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
