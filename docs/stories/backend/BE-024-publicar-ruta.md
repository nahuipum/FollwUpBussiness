# BE-024 — Publicar ruta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** publicar ruta  
    **Para** hacerla disponible

    ## Alcance

    Validar y emitir evento.

    ## Criterios de aceptación

    1. Ruta válida.
2. Vendedor activo.
3. Evento route.published.
4. Visible en mobile.

    ## Referencias

    - RF-RUT-005
- RF-RUT-006
- RF-RUT-007

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
