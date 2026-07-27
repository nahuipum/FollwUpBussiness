# INT-027 — Reintentos y DLQ E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** gestionar procesos fallidos  
    **Para** evitar pérdida silenciosa

    ## Alcance

    Outbox + RabbitMQ + consumidores + monitoring.

    ## Criterios de aceptación

    1. Retry limitado.
2. DLQ visible.
3. Idempotencia.
4. Alerta.

    ## Referencias

    - ADR-005
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
