# BE-055 — Implementar outbox transaccional

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** sistema  
    **Quiero** publicar eventos consistentemente  
    **Para** evitar pérdida

    ## Alcance

    Outbox y publicador.

    ## Criterios de aceptación

    1. Commit crea outbox.
2. Rollback no publica.
3. Publicador idempotente.
4. Errores observables.

    ## Referencias

    - RNF-013
- RNF-014

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
