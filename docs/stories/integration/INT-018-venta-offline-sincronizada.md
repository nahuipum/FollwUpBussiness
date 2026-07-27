# INT-018 — Venta offline sincronizada

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Offline  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar venta sin red  
    **Para** no perder operación

    ## Alcance

    Base local + sync + API.

    ## Criterios de aceptación

    1. Pendiente visible.
2. No duplica.
3. Referencia servidor.
4. Dashboard actualiza.

    ## Referencias

    - RF-VTA-012

    ## Seguridad y privacidad

    - Validar aislamiento multiempresa de extremo a extremo.
- No liberar con hallazgos Critical o High.

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
