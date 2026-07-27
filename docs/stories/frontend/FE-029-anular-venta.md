# FE-029 — Anular venta

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario autorizado  
    **Quiero** anular venta  
    **Para** corregir operación

    ## Alcance

    Acción con motivo.

    ## Criterios de aceptación

    1. Permiso.
2. Motivo.
3. No desaparece.
4. Indicadores actualizados.

    ## Referencias

    - RF-VTA-010

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
