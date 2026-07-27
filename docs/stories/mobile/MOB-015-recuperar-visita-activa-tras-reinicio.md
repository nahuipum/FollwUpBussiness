# MOB-015 — Recuperar visita activa tras reinicio

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recuperar visita  
    **Para** no perder contexto

    ## Alcance

    Restaurar desde base local.

    ## Criterios de aceptación

    1. Muestra activa.
2. Impide otra.
3. Inicio original.
4. Sincroniza.

    ## Referencias

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
