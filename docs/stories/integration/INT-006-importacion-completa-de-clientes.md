# INT-006 — Importación completa de clientes

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** importar cartera  
    **Para** configurar masivamente

    ## Alcance

    Upload + RabbitMQ + DB + UI.

    ## Criterios de aceptación

    1. Archivo aceptado.
2. Asíncrono.
3. Resultado visible.
4. Errores descargables.
5. API no bloqueada.

    ## Referencias

    - HU-011

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
