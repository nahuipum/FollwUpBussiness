# INT-012 — Recorrido histórico E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** consultar recorrido  
    **Para** comparar ejecución

    ## Alcance

    Persistencia + API + mapa.

    ## Criterios de aceptación

    1. Secuencia temporal.
2. Puntos visita.
3. Filtros.
4. Retención.

    ## Referencias

    - HU-032

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
