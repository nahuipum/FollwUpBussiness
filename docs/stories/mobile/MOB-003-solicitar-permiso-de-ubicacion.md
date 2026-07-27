# MOB-003 — Solicitar permiso de ubicación

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Permisos  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** autorizar ubicación  
    **Para** usar jornada y visitas

    ## Alcance

    Flujo foreground/background.

    ## Criterios de aceptación

    1. Explica finalidad.
2. Maneja rechazo.
3. Abre configuración.
4. No inicia tracking sin permiso.

    ## Referencias

    - 17.2
- RF-UBI-001

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
