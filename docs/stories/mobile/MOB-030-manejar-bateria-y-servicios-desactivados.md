# MOB-030 — Manejar batería y servicios desactivados

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Experiencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recibir avisos técnicos  
    **Para** corregir problemas

    ## Alcance

    Alertas GPS/permisos/batería.

    ## Criterios de aceptación

    1. Accionable.
2. No simula tracking.
3. Estado registrado.
4. Reintento.

    ## Referencias

    - R-001
- R-002

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
