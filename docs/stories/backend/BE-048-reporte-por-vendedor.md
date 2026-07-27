# BE-048 — Reporte por vendedor

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** consultar desempeño  
    **Para** medir productividad

    ## Alcance

    Calcular cobertura, ventas y tiempos.

    ## Criterios de aceptación

    1. Programados/visitados/omitidos.
2. Ventas/ticket.
3. Inicio/cierre.
4. Distancia disponible.

    ## Referencias

    - RF-REP-002

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
