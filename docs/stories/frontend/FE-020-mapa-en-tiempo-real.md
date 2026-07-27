# FE-020 — Mapa en tiempo real

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** ver vendedores activos  
    **Para** supervisar jornada

    ## Alcance

    Mapa conectado por WebSocket.

    ## Criterios de aceptación

    1. Ubicación/hora.
2. Stale diferenciado.
3. Filtro equipo.
4. Reconexión/fallback.

    ## Referencias

    - RF-UBI-004
- HU-031

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
