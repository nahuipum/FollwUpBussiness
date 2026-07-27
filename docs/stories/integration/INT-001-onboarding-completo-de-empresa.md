# INT-001 — Onboarding completo de empresa

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Onboarding  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** superadministrador  
    **Quiero** crear empresa y administrador  
    **Para** habilitar operación

    ## Alcance

    Integrar alta de tenant, configuración y acceso.

    ## Criterios de aceptación

    1. Empresa creada.
2. Administrador inicia sesión.
3. Configuración disponible.
4. Datos aislados.

    ## Referencias

    - Flujo 12.1

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
