# INT-009 — Reasignación E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** reasignar ruta  
    **Para** resolver cambios

    ## Alcance

    Backend + notificación + mobile.

    ## Criterios de aceptación

    1. Conserva visitas.
2. Nuevo recibe.
3. Anterior actualizado.
4. Auditoría.

    ## Referencias

    - HU-022

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
