# BE-007 — Gestionar roles y permisos

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** asignar roles y permisos  
    **Para** restringir funciones

    ## Alcance

    Implementar roles y autorización por recurso.

    ## Criterios de aceptación

    1. Endpoint valida permiso.
2. Supervisor solo su equipo.
3. Vendedor solo su información.
4. Cambio auditado.

    ## Referencias

    - RF-AUT-003
- RNF-006

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
