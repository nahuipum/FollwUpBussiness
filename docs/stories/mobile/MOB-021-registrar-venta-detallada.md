# MOB-021 — Registrar venta detallada

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** agregar productos  
    **Para** capturar detalle

    ## Alcance

    Carrito local.

    ## Criterios de aceptación

    1. Varios productos.
2. Cantidad/descuento.
3. Servidor recalcula.
4. Total visible.

    ## Referencias

    - RF-VTA-002
- RF-VTA-005

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
