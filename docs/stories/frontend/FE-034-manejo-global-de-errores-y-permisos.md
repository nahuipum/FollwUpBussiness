# FE-034 — Manejo global de errores y permisos

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Experiencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario web  
    **Quiero** recibir mensajes claros  
    **Para** saber qué hacer

    ## Alcance

    Manejo uniforme 401/403/404/409/422/500.

    ## Criterios de aceptación

    1. Sin datos sensibles.
2. Acción sugerida.
3. Sesión vencida.
4. CorrelationId visible.

    ## Referencias

    - RNF-002
- RNF-006

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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
