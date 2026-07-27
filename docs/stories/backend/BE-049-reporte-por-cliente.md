# BE-049 — Reporte por cliente

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** consultar desempeño del cliente  
    **Para** entender recurrencia

    ## Alcance

    Calcular última visita/compra.

    ## Criterios de aceptación

    1. Días sin compra.
2. Productos/resultados.
3. Permisos.
4. Periodo.

    ## Referencias

    - RF-REP-003

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
