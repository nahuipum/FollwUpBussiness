# BE-038 — Autorizar excepción de geocerca

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador autorizado  
    **Quiero** autorizar excepción  
    **Para** resolver caso justificado

    ## Alcance

    Registrar motivo y evidencia.

    ## Criterios de aceptación

    1. Rol autorizado.
2. Motivo obligatorio.
3. Ubicación original intacta.
4. Auditoría.

    ## Referencias

    - RN-007

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
