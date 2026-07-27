# INT-022 — Dashboard diario E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Dashboard  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ver operación consolidada  
    **Para** tomar decisiones

    ## Alcance

    Proyecciones + API + React.

    ## Criterios de aceptación

    1. Indicadores.
2. Filtros.
3. Permisos.
4. Consistencia.

    ## Referencias

    - HU-060

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
