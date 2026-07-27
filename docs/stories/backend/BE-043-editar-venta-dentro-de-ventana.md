# BE-043 — Editar venta dentro de ventana

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor autorizado  
    **Quiero** editar venta reciente  
    **Para** corregir información

    ## Alcance

    Aplicar ventana configurable.

    ## Criterios de aceptación

    1. Valida tiempo.
2. Audita cambios.
3. Respeta cierre.
4. Recalcula total.

    ## Referencias

    - RN-012

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
