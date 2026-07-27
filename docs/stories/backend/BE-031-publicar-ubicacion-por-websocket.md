# BE-031 — Publicar ubicación por WebSocket

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** recibir cambios de ubicación  
    **Para** supervisar jornada

    ## Alcance

    Publicar a suscripciones autorizadas.

    ## Criterios de aceptación

    1. Solo usuarios autorizados.
2. Incluye capturedAt y stale.
3. No mezcla empresas.
4. Orden temporal protegido.

    ## Referencias

    - RF-UBI-004
- RN-016

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
