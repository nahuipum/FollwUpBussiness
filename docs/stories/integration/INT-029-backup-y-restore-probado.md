# INT-029 — Backup y restore probado

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Recuperación  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** restaurar información  
    **Para** recuperar servicio

    ## Alcance

    Backup PostgreSQL/PostGIS.

    ## Criterios de aceptación

    1. Automático.
2. Restore aislado.
3. Consistencia.
4. RPO/RTO.

    ## Referencias

    - RNF-009
- RNF-010

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
