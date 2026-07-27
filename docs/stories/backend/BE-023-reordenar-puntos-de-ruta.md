# BE-023 — Reordenar puntos de ruta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** modificar secuencia  
    **Para** ajustar operación

    ## Alcance

    Actualizar orden y estimaciones.

    ## Criterios de aceptación

    1. Sin duplicados.
2. Solo ruta editable.
3. Recalcula estimaciones.
4. Auditoría.

    ## Referencias

    - RF-RUT-004

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
