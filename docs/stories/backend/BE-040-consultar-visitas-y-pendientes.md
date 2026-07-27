# BE-040 — Consultar visitas y pendientes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** filtrar visitas  
    **Para** controlar cumplimiento

    ## Alcance

    Listar realizadas, pendientes y fuera de ruta.

    ## Criterios de aceptación

    1. Filtros.
2. Duración/resultado.
3. Distancia check-in.
4. Permisos.

    ## Referencias

    - RF-VIS-009
- HU-043

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
