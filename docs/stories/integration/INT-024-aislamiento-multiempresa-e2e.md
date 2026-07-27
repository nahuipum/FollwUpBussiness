# INT-024 — Aislamiento multiempresa E2E

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Seguridad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** empresa  
    **Quiero** mantener datos aislados  
    **Para** proteger información

    ## Alcance

    API + DB + Redis + WebSocket + cola + clientes.

    ## Criterios de aceptación

    1. Sin acceso cruzado.
2. Caches separadas.
3. Topics separados.
4. Exports separados.

    ## Referencias

    - RN-001
- RN-002

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
