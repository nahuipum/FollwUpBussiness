# INT-004 — Alta de vendedor disponible en mobile

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear vendedor y acceso  
    **Para** incorporarlo

    ## Alcance

    Panel + backend + mobile.

    ## Criterios de aceptación

    1. Creado.
2. Puede iniciar sesión.
3. Solo su información.
4. Auditoría.

    ## Referencias

    - HU-002

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
