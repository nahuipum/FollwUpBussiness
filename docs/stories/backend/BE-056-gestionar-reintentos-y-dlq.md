# BE-056 — Gestionar reintentos y DLQ

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** operador  
    **Quiero** controlar mensajes fallidos  
    **Para** evitar pérdida silenciosa

    ## Alcance

    Políticas de retry/backoff/DLQ.

    ## Criterios de aceptación

    1. Reintentos limitados.
2. Permanentes a DLQ.
3. CorrelationId.
4. Métrica/alerta.

    ## Referencias

    - RNF-014

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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
