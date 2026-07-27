# BE-051 — Registrar acciones críticas

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Auditoría  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** auditor  
    **Quiero** tener trazabilidad  
    **Para** investigar cambios

    ## Alcance

    Capturar acciones del contrato.

    ## Criterios de aceptación

    1. Empresa/usuario/entidad/fecha.
2. Anterior/nuevo.
3. Inmutable ordinariamente.
4. Retención.

    ## Referencias

    - RF-AUD-001
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
