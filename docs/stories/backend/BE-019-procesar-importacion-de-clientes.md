# BE-019 — Procesar importación de clientes

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** importar CSV o Excel  
    **Para** evitar carga manual

    ## Alcance

    Proceso asíncrono con validación.

    ## Criterios de aceptación

    1. Valida tipo y estructura.
2. Errores por fila.
3. Detecta duplicados.
4. Resume insertados/rechazados.
5. Audita.

    ## Referencias

    - RF-CLI-004
- HU-011

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
