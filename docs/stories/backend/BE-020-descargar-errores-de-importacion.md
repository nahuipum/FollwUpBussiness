# BE-020 — Descargar errores de importación

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** descargar errores  
    **Para** corregir registros

    ## Alcance

    Archivo de errores seguro.

    ## Criterios de aceptación

    1. Fila y motivo.
2. Solo tenant.
3. Evita fórmula CSV.
4. Expiración.

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
