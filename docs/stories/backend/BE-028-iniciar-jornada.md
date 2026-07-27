# BE-028 — Iniciar jornada

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Jornadas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar jornada  
    **Para** habilitar seguimiento

    ## Alcance

    Crear jornada con ubicación inicial.

    ## Criterios de aceptación

    1. Una activa máximo.
2. Hora/coordenada/dispositivo.
3. Ubicación válida.
4. Evento journey.started.

    ## Referencias

    - RF-UBI-001
- HU-030

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
