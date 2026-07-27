# MOB-020 — Registrar venta simple

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar concepto y monto  
    **Para** capturar venta MVP

    ## Alcance

    Formulario simplificado.

    ## Criterios de aceptación

    1. Cantidad positiva.
2. Monto válido.
3. Cliente/visita.
4. Offline.

    ## Referencias

    - RF-VTA-004
- HU-050

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
