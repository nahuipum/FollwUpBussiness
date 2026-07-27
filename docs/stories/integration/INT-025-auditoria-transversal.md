# INT-025 — Auditoría transversal

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Auditoría  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador autorizado  
    **Quiero** consultar acciones  
    **Para** tener trazabilidad

    ## Alcance

    Dominios + API + frontend.

    ## Criterios de aceptación

    1. Acciones críticas.
2. Anterior/nuevo.
3. Consulta restringida.
4. Sin secretos.

    ## Referencias

    - RF-AUD-001
- RF-AUD-002

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
