# INT-031 — Retención y eliminación lógica E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Privacidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** aplicar retención  
    **Para** cumplir privacidad

    ## Alcance

    Configuración + jobs + consultas.

    ## Criterios de aceptación

    1. Historial requerido.
2. Ubicación expira.
3. Eliminación lógica.
4. Acceso restringido.

    ## Referencias

    - RN-013
- 17.3

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
