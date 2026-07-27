# BE-018 — Generar plantilla de clientes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** descargar plantilla  
    **Para** preparar importación

    ## Alcance

    Plantilla versionada.

    ## Criterios de aceptación

    1. Coincide con contrato.
2. Marca obligatorios.
3. Incluye ejemplo seguro.
4. Tiene versión.

    ## Referencias

    - RF-CLI-004

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
