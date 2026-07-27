# INT-015 — Visita offline sincronizada

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Offline  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar sin red  
    **Para** continuar trabajo

    ## Alcance

    Base local + sync + API idempotente.

    ## Criterios de aceptación

    1. Sobrevive reinicio.
2. Sincroniza.
3. No duplica.
4. Conserva fecha/ubicación.

    ## Referencias

    - HU-042

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
