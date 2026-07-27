# INT-030 — Validación de rendimiento MVP

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Rendimiento  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** producto  
    **Quiero** validar tiempos  
    **Para** asegurar uso aceptable

    ## Alcance

    API + mapas + importación + tracking.

    ## Criterios de aceptación

    1. Objetivo de respuesta.
2. Volumen definido.
3. Cuellos documentados.
4. Aislamiento intacto.

    ## Referencias

    - RNF-002
- RNF-003

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
