# INT-011 — Ubicación en tiempo real E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** ver ubicación reciente  
    **Para** supervisar vendedores

    ## Alcance

    Background + API + Redis + WebSocket + React.

    ## Criterios de aceptación

    1. Actualizaciones.
2. Hora visible.
3. Stale.
4. Tenant aislado.

    ## Referencias

    - HU-031

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
