# BE-053 — Notificar ruta publicada o modificada

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Notificaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recibir aviso  
    **Para** conocer cambios

    ## Alcance

    Consumir evento y notificar.

    ## Criterios de aceptación

    1. Solo afectado.
2. Fecha y cambio.
3. No duplica descontroladamente.
4. Entrega/fallo visible.

    ## Referencias

    - RF-RUT-007

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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
