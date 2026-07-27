# INT-032 — Revisión de seguridad del flujo crítico

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Seguridad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** producto  
    **Quiero** validar seguridad  
    **Para** reducir riesgo

    ## Alcance

    Threat model y pruebas auth/tenant/ubicación/sync.

    ## Criterios de aceptación

    1. Sin Critical/High.
2. BOLA probado.
3. Replay probado.
4. WebSocket probado.
5. Storage mobile probado.

    ## Referencias

    - 23.3
- 17

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
