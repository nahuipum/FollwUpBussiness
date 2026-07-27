# FE-016 — Generar ruta automática

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** solicitar propuesta  
    **Para** reducir trabajo

    ## Alcance

    Restricciones y propuesta visual.

    ## Criterios de aceptación

    1. Orden/distancia/duración.
2. Editable.
3. No publica sola.
4. Error proveedor.

    ## Referencias

    - RF-RUT-002
- RF-RUT-003
- HU-021

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
