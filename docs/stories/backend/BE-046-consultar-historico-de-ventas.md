# BE-046 — Consultar histórico de ventas

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** consultar ventas históricas  
    **Para** analizar comportamiento

    ## Alcance

    Consulta paginada y agregada.

    ## Criterios de aceptación

    1. Filtro periodo.
2. Acumulado/ticket.
3. Permisos.
4. Exportable.

    ## Referencias

    - RF-VTA-007
- RF-VTA-008
- RF-VTA-009
- HU-052
- HU-053

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
