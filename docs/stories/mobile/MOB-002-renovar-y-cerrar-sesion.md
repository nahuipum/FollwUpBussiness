# MOB-002 — Renovar y cerrar sesión

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** mantener o cerrar sesión  
    **Para** trabajar seguro

    ## Alcance

    Renovación, expiración y logout.

    ## Criterios de aceptación

    1. Renueva según contrato.
2. Logout detiene servicios.
3. Limpia datos definidos.
4. No borra pendientes sin regla.

    ## Referencias

    - RF-AUT-004
- RN-020

    ## Seguridad y privacidad

    - Usar almacenamiento seguro.
- Rastrear solo durante jornada activa.

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
