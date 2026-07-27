# MOB-010 — Mostrar conectividad y sincronización

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** saber si se enviaron datos  
    **Para** tener confianza

    ## Alcance

    Indicadores de red y cola.

    ## Criterios de aceptación

    1. Offline/pendiente/error/synced.
2. No éxito anticipado.
3. Reintento.
4. Mensaje accionable.

    ## Referencias

    - RF-VTA-012
- HU-042

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
