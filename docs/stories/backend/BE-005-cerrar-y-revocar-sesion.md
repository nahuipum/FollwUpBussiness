# BE-005 — Cerrar y revocar sesión

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario autenticado  
    **Quiero** cerrar mi sesión  
    **Para** evitar reutilización

    ## Alcance

    Invalidar sesión y limpiar presencia asociada.

    ## Criterios de aceptación

    1. Logout invalida sesión.
2. Usuario bloqueado pierde acceso.
3. No afecta otros tenants.
4. Se audita.

    ## Referencias

    - RF-AUT-004
- RF-AUT-005

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
