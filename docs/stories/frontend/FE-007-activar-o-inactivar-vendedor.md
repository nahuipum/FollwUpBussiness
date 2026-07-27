# FE-007 — Activar o inactivar vendedor

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Vendedores  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** cambiar estado  
    **Para** controlar acceso

    ## Alcance

    Acción confirmada.

    ## Criterios de aceptación

    1. Confirmación.
2. Error por jornada activa.
3. Actualiza estado.
4. No borra.

    ## Referencias

    - RF-VEN-003

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
