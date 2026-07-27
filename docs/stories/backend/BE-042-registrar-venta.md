# BE-042 — Registrar venta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar venta  
    **Para** actualizar gestión

    ## Alcance

    Crear venta y detalles con idempotencia.

    ## Criterios de aceptación

    1. Asocia empresa/vendedor/cliente.
2. Visita por defecto.
3. Valida importes.
4. Servidor calcula total.
5. No duplica.

    ## Referencias

    - RF-VTA-001
- RF-VTA-002
- RF-VTA-005
- HU-050

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
