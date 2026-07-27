# MOB-022 — Sincronizar venta idempotente

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** sincronizar venta offline  
    **Para** evitar pérdida o duplicado

    ## Alcance

    Comando UUID.

    ## Criterios de aceptación

    1. Reintento no duplica.
2. Fecha original.
3. Error permanente visible.
4. Referencia servidor.

    ## Referencias

    - RF-VTA-012
- RNF-013

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
