# BE-030 — Mantener última ubicación en Redis

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Tracking  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** sistema  
    **Quiero** mantener presencia reciente  
    **Para** servir baja latencia

    ## Alcance

    Actualizar estado efímero con TTL.

    ## Criterios de aceptación

    1. Key incluye tenant.
2. No reemplaza dato nuevo por antiguo.
3. Expira.
4. Caída Redis no elimina fuente.

    ## Referencias

    - RF-UBI-004
- RN-016

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
