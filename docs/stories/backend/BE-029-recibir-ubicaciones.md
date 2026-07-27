# BE-029 — Recibir ubicaciones

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** enviar ubicaciones periódicas  
    **Para** permitir seguimiento

    ## Alcance

    Aceptar lotes y validar muestras.

    ## Criterios de aceptación

    1. Requiere jornada activa.
2. Valida latitud, longitud, precisión y fecha.
3. Marca o rechaza muestra antigua.
4. Idempotente por muestra.

    ## Referencias

    - RF-UBI-002
- RF-UBI-003
- 15.1

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
