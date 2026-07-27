# FE-004 — Gestión de usuarios y roles

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Usuarios  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** administrar usuarios  
    **Para** controlar accesos

    ## Alcance

    Lista, alta, edición y bloqueo.

    ## Criterios de aceptación

    1. Permisos.
2. Estado visible.
3. Confirmación bloqueo.
4. Lista actualizada.

    ## Referencias

    - RF-AUT-003
- RF-AUT-005

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
