# MOB-024 — Cerrar jornada

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar jornada  
    **Para** finalizar tracking

    ## Alcance

    Flujo con validaciones.

    ## Criterios de aceptación

    1. Advierte visita activa.
2. Muestra pendientes.
3. Detiene tracking.
4. Resumen.

    ## Referencias

    - RF-UBI-007
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
