# INT-008 — Generación automática E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** generar ruta  
    **Para** reducir planificación

    ## Alcance

    Motor + PostGIS + panel.

    ## Criterios de aceptación

    1. Propuesta.
2. Estimaciones.
3. Edición.
4. Publicación manual.

    ## Referencias

    - HU-021

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
