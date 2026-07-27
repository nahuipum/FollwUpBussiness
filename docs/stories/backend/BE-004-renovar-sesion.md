# BE-004 — Renovar sesión

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario autenticado  
    **Quiero** renovar mi sesión  
    **Para** continuar trabajando

    ## Alcance

    Implementar renovación y revocación según ADR.

    ## Criterios de aceptación

    1. Sesión válida se renueva.
2. Revocada no se renueva.
3. No se extiende indefinidamente.
4. Resultado auditable.

    ## Referencias

    - RF-AUT-004

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
