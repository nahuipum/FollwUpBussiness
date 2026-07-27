# BE-017 — Consultar historial de cliente

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** ver visitas y ventas  
    **Para** analizar cliente

    ## Alcance

    Resumen e históricos paginados.

    ## Criterios de aceptación

    1. Última visita y venta.
2. Orden por fecha.
3. Filtro periodo.
4. Permisos.

    ## Referencias

    - RF-CLI-008
- HU-012

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
