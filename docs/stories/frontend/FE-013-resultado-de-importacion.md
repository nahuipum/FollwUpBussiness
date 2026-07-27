# FE-013 — Resultado de importación

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ver resultado  
    **Para** corregir datos

    ## Alcance

    Pantalla de estado asíncrono.

    ## Criterios de aceptación

    1. Válidos/rechazados/duplicados.
2. Descarga errores.
3. Estado en progreso.
4. Fallo manejado.

    ## Referencias

    - RF-CLI-004

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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
