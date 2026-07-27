# MOB-013 — Iniciar visita online

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar visita  
    **Para** registrar atención

    ## Alcance

    Enviar check-in idempotente.

    ## Criterios de aceptación

    1. Resultado servidor.
2. Guarda visita activa.
3. Maneja 409/422.
4. No duplica.

    ## Referencias

    - RF-VIS-003
- RF-VIS-004

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
