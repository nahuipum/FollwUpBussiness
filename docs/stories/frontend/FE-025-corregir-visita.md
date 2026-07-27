# FE-025 — Corregir visita

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador autorizado  
    **Quiero** corregir visita  
    **Para** resolver error

    ## Alcance

    Formulario con motivo.

    ## Criterios de aceptación

    1. Permiso.
2. Valor anterior.
3. Confirmación.
4. Auditoría visible.

    ## Referencias

    - RF-VIS-008

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
