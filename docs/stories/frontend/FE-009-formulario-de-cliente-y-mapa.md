# FE-009 — Formulario de cliente y mapa

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** registrar o editar cliente  
    **Para** mantener puntos

    ## Alcance

    Formulario con selector geográfico.

    ## Criterios de aceptación

    1. Selecciona punto.
2. Valida coordenadas.
3. Advierte duplicados.
4. Protege cambios no guardados.

    ## Referencias

    - RF-CLI-001
- RF-CLI-002
- RF-CLI-005

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
