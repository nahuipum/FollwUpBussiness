# FE-022 — Historial de recorrido

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** consultar recorrido  
    **Para** analizar ejecución

    ## Alcance

    Mapa y timeline.

    ## Criterios de aceptación

    1. Filtro fecha.
2. Puntos visita.
3. Histórico no parece vivo.
4. Maneja volumen.

    ## Referencias

    - RF-UBI-006
- HU-032

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
