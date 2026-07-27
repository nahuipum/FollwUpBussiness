# MOB-026 — Mostrar indicador de rastreo

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Privacidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** saber cuándo se usa ubicación  
    **Para** tener transparencia

    ## Alcance

    Indicador persistente.

    ## Criterios de aceptación

    1. Visible durante jornada.
2. Desaparece al cerrar.
3. Explica finalidad.
4. No rastrea fuera.

    ## Referencias

    - RN-004
- RF-UBI-008

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
