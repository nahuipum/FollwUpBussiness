# MOB-028 — Recuperar cola tras cierre forzado

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Resiliencia  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** recuperar pendientes  
    **Para** no perder operaciones

    ## Alcance

    Sync reiniciable.

    ## Criterios de aceptación

    1. Pending permanece.
2. Sync reanuda.
3. Synced no repite.
4. Errores visibles.

    ## Referencias

    - 15.3
- RNF-012
- RNF-013

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
