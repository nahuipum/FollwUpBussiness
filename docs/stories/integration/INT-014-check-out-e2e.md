# INT-014 — Check-out E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar visita  
    **Para** registrar resultado

    ## Alcance

    Mobile + API + eventos + panel.

    ## Criterios de aceptación

    1. Resultado.
2. Duración.
3. Ruta actualizada.
4. Panel refleja.

    ## Referencias

    - HU-041

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
