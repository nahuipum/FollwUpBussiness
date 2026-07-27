# INT-010 — Inicio de jornada y presencia

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar jornada  
    **Para** ser visible

    ## Alcance

    Mobile + API + Redis + WebSocket.

    ## Criterios de aceptación

    1. Jornada creada.
2. Tracking activo.
3. Supervisor ve estado.
4. Una sola jornada.

    ## Referencias

    - HU-030

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
