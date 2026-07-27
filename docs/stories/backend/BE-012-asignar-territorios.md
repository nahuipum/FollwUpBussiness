# BE-012 — Asignar territorios

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** asignar zonas  
    **Para** organizar cobertura

    ## Alcance

    Gestionar una o más zonas.

    ## Criterios de aceptación

    1. Zonas pertenecen a empresa.
2. Admite varias.
3. Filtros reflejan cambio.
4. Auditoría.

    ## Referencias

    - RF-VEN-005

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
