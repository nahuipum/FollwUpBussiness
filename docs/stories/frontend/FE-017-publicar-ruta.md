# FE-017 — Publicar ruta

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** publicar ruta  
    **Para** enviarla al vendedor

    ## Alcance

    Acción validada.

    ## Criterios de aceptación

    1. Estado válido.
2. Confirma vendedor/fecha.
3. Resultado visible.
4. Estado actualizado.

    ## Referencias

    - RF-RUT-006
- RF-RUT-007

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
