# MOB-029 — Recibir ruta asignada o modificada

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Notificaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recibir notificación  
    **Para** enterarme de cambios

    ## Alcance

    Push/local y actualización.

    ## Criterios de aceptación

    1. Fecha/ruta.
2. Sin datos sensibles bloqueado.
3. Abrir actualiza.
4. Offline manejado.

    ## Referencias

    - RF-RUT-007

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
