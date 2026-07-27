# BE-003 — Autenticar usuario

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario registrado  
    **Quiero** autenticarme  
    **Para** acceder según mi rol

    ## Alcance

    Implementar login seguro.

    ## Criterios de aceptación

    1. Credenciales válidas crean sesión.
2. Usuario o empresa inactiva se rechaza.
3. Error no revela existencia.
4. Sesión asociada a empresa y rol.

    ## Referencias

    - RF-AUT-001
- RNF-005

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
