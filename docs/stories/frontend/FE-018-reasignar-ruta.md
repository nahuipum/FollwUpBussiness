# FE-018 — Reasignar ruta

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** cambiar vendedor  
    **Para** resolver ausencia

    ## Alcance

    Flujo con impacto.

    ## Criterios de aceptación

    1. Vendedor activo.
2. No pierde visitas.
3. Actualiza detalle.
4. Notificación visible.

    ## Referencias

    - RF-RUT-009
- HU-022

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
