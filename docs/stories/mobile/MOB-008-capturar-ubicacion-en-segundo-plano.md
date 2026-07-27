# MOB-008 — Capturar ubicación en segundo plano

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** enviar ubicación  
    **Para** permitir supervisión

    ## Alcance

    Servicio adaptativo.

    ## Criterios de aceptación

    1. Opera con pantalla bloqueada.
2. Ajusta frecuencia.
3. Notificación persistente.
4. Se detiene al cerrar.

    ## Referencias

    - RF-UBI-002
- RF-UBI-003
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
