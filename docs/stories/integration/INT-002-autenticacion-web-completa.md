# INT-002 — Autenticación web completa

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** iniciar y cerrar sesión web  
    **Para** usar panel

    ## Alcance

    React + API + seguridad.

    ## Criterios de aceptación

    1. Login.
2. Roles.
3. Expiración.
4. Logout revoca y limpia.

    ## Referencias

    - HU-001
- RF-AUT

    ## Seguridad y privacidad

    - Validar aislamiento multiempresa de extremo a extremo.
- No liberar con hallazgos Critical o High.

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
