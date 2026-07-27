# FE-002 — Recuperación de contraseña

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario  
    **Quiero** solicitar recuperación  
    **Para** recuperar acceso

    ## Alcance

    Pantallas de solicitud y restablecimiento.

    ## Criterios de aceptación

    1. Confirmación neutral.
2. Nueva contraseña validada.
3. Token vencido manejado.
4. No revela cuenta.

    ## Referencias

    - RF-AUT-002

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
