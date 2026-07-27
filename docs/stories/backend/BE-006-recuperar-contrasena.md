# BE-006 — Recuperar contraseña

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario registrado  
    **Quiero** restablecer mi contraseña  
    **Para** recuperar acceso

    ## Alcance

    Token temporal de un solo uso.

    ## Criterios de aceptación

    1. No revela si cuenta existe.
2. Token expira.
3. Contraseña cumple política.
4. Puede revocar sesiones previas.

    ## Referencias

    - RF-AUT-002

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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
