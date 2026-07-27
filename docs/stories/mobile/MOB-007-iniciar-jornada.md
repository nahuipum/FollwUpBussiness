# MOB-007 — Iniciar jornada

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar jornada  
    **Para** activar seguimiento

    ## Alcance

    Validar permisos y crear jornada.

    ## Criterios de aceptación

    1. Servicios activos.
2. Ubicación inicial.
3. Indicador tracking.
4. Evita segunda jornada.

    ## Referencias

    - RF-UBI-001
- HU-030

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
