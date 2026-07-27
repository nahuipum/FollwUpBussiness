# BE-050 — Exportar reportes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** exportar datos  
    **Para** analizar externamente

    ## Alcance

    Generar archivo asíncrono.

    ## Criterios de aceptación

    1. Respeta filtros/tenant.
2. Evita fórmula.
3. Estado de proceso.
4. Archivo expira.

    ## Referencias

    - RF-REP-005
- RF-VTA-011

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
