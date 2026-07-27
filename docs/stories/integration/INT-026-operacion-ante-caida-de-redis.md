# INT-026 — Operación ante caída de Redis

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** mantener modo degradado  
    **Para** evitar pérdida

    ## Alcance

    Backend + tracking + frontend sin Redis.

    ## Criterios de aceptación

    1. Fuente intacta.
2. Degradación visible.
3. Recuperación.
4. Alerta.

    ## Referencias

    - RNF-001
- ADR-004

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
