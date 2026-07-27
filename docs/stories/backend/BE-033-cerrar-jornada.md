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
