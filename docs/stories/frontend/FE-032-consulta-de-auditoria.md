# FE-032 — Consulta de auditoría

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Auditoría  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador autorizado  
    **Quiero** consultar cambios  
    **Para** tener trazabilidad

    ## Alcance

    Tabla filtrable.

    ## Criterios de aceptación

    1. Filtros.
2. Sin secretos.
3. Paginación.
4. Permisos.

    ## Referencias

    - RF-AUD-002

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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
