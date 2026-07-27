# MOB-025 — Resolver cierre con pendientes

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Jornada  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** gestionar datos pendientes  
    **Para** evitar pérdida

    ## Alcance

    Política de cierre.

    ## Criterios de aceptación

    1. Cantidad pendiente.
2. Intenta sincronizar.
3. No elimina.
4. Estado de cierre.

    ## Referencias

    - RF-UBI-007

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
