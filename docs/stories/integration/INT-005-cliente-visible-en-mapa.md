# INT-005 — Cliente visible en mapa

    **Área:** Integración  
    **Tipo:** Historia de integración E2E  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear punto de cliente  
    **Para** usarlo en rutas

    ## Alcance

    Formulario + API + PostGIS + mapa.

    ## Criterios de aceptación

    1. Punto persistido.
2. Aparece en mapa.
3. Duplicados.
4. Edición actualiza.

    ## Referencias

    - HU-010

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
