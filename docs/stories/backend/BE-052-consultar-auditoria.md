# BE-052 — Consultar auditoría

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Auditoría  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador autorizado  
    **Quiero** filtrar auditoría  
    **Para** supervisar cambios

    ## Alcance

    Endpoint restringido.

    ## Criterios de aceptación

    1. Filtros.
2. Sin secretos.
3. Solo autorizados.
4. Tenant.

    ## Referencias

    - RF-AUD-002

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
