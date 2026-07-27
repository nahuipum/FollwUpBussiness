# MOB-009 — Encolar ubicaciones sin conexión

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** guardar ubicaciones  
    **Para** evitar huecos

    ## Alcance

    Persistencia local temporal.

    ## Criterios de aceptación

    1. No pierde muestras relevantes.
2. Envía lotes.
3. Límite local.
4. Retención.

    ## Referencias

    - RNF-012
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
