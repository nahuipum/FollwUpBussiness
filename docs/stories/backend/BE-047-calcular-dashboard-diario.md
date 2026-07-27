# BE-047 — Calcular dashboard diario

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** consultar indicadores  
    **Para** conocer operación

    ## Alcance

    Consolidar tracking, visitas y ventas.

    ## Criterios de aceptación

    1. Estados vendedores.
2. Visitas planificadas/realizadas/pendientes.
3. Ventas/monto/conversión.
4. Filtros y permisos.

    ## Referencias

    - RF-REP-001
- HU-060

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
