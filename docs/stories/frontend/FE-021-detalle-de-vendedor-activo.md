# FE-021 — Detalle de vendedor activo

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** ver estado y ruta  
    **Para** entender situación

    ## Alcance

    Panel lateral de jornada.

    ## Criterios de aceptación

    1. Estado.
2. Precisión/última actualización.
3. Visitas/ventas día.
4. Permisos.

    ## Referencias

    - RF-UBI-004
- RF-UBI-005

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
