# INT-028 — Correlation ID E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Observabilidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** soporte  
    **Quiero** seguir operación  
    **Para** diagnosticar errores

    ## Alcance

    Clientes + API + eventos + logs.

    ## Criterios de aceptación

    1. Mismo ID.
2. Visible al usuario.
3. Sin datos sensibles.
4. Consultable.

    ## Referencias

    - RNF-014

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
