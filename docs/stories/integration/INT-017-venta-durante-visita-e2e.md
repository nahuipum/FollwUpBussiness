# INT-017 — Venta durante visita E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar venta  
    **Para** actualizar gestión

    ## Alcance

    Mobile + API + DB + evento + panel.

    ## Criterios de aceptación

    1. Asociaciones.
2. Total.
3. Ventas día.
4. Auditoría.

    ## Referencias

    - HU-050

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
