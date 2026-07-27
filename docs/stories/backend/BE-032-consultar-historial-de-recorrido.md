# BE-032 — Consultar historial de recorrido

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** consultar recorrido  
    **Para** comparar ejecución

    ## Alcance

    Endpoint de recorrido por jornada.

    ## Criterios de aceptación

    1. Filtro vendedor/fecha.
2. Respeta retención.
3. Secuencia temporal.
4. Permisos.

    ## Referencias

    - RF-UBI-006
- HU-032

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
