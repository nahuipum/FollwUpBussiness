# INT-016 — Consulta administrativa de visitas

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ver visitas  
    **Para** controlar cumplimiento

    ## Alcance

    API + filtros + frontend.

    ## Criterios de aceptación

    1. Filtros.
2. Detalle.
3. Fuera de ruta.
4. Permisos.

    ## Referencias

    - HU-043

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
