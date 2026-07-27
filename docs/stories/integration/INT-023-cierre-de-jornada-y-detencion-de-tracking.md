# INT-023 — Cierre de jornada y detención de tracking

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar jornada  
    **Para** finalizar seguimiento

    ## Alcance

    Mobile + API + Redis + WebSocket.

    ## Criterios de aceptación

    1. Visita abierta validada.
2. Pendientes tratados.
3. Tracking detenido.
4. Panel finalizado.

    ## Referencias

    - RF-UBI-007
- RF-UBI-008

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
