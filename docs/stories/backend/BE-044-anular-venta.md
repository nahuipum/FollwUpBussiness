# BE-044 — Anular venta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario autorizado  
    **Quiero** anular venta  
    **Para** corregir operación

    ## Alcance

    Cambio lógico con motivo.

    ## Criterios de aceptación

    1. Permiso y motivo.
2. No elimina.
3. Actualiza reportes.
4. Evento/auditoría.

    ## Referencias

    - RF-VTA-010
- RN-013

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
