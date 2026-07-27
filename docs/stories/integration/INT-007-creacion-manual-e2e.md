# INT-007 — Creación manual E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear y publicar ruta  
    **Para** enviarla al vendedor

    ## Alcance

    Panel + API + evento + mobile.

    ## Criterios de aceptación

    1. Borrador.
2. Orden editable.
3. Publicación.
4. Mobile descarga.

    ## Referencias

    - HU-020

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
