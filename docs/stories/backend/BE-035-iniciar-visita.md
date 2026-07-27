# BE-035 — Iniciar visita

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar visita  
    **Para** registrar atención

    ## Alcance

    Crear visita idempotente.

    ## Criterios de aceptación

    1. Jornada activa.
2. Una visita activa.
3. Guarda coordenadas y distancia.
4. Reintento no duplica.

    ## Referencias

    - RF-VIS-002
- RF-VIS-003
- RF-VIS-004
- HU-040

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
