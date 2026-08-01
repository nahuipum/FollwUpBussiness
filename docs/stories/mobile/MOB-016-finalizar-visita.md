# MOB-016 — Finalizar visita

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar visita  
    **Para** registrar resultado

    ## Alcance

    Formulario de cierre.

    ## Criterios de aceptación

    1. Resultado obligatorio.
2. Comentario según regla.
3. Hora/ubicación.
4. Actualiza ruta.

    ## Referencias

    - RF-VIS-005
- HU-041

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
- **Predecesoras obligatorias:** `BE-036` — Finalizar visita; `MOB-013` — Iniciar visita online; `MOB-014` — Iniciar visita offline
- **Historias consecuentes que habilita:** `INT-014` — Check-out E2E; `INT-015` — Visita offline sincronizada; `MOB-017` — Registrar motivo de no venta; `MOB-020` — Registrar venta simple; `MOB-021` — Registrar venta detallada; `MOB-025` — Resolver cierre con pendientes
- **Validación vertical:** `INT-014` — Check-out E2E; `INT-015` — Visita offline sincronizada

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/visits`; eventos `visit.*`; comandos sync `visit.*`.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Visita, jornada, ruta/cliente, inicio/cierre, coordenadas, resultado, excepción y duración.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: duplicados, visita simultánea, fraude de ubicación y pérdida offline.

## Fuera de alcance

- borrar historial o convertir automáticamente toda visita en venta.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
