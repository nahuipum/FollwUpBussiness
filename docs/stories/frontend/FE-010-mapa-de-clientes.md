# FE-010 — Mapa de clientes

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ver clientes en mapa  
    **Para** analizar cobertura

    ## Alcance

    Mapa y lista alternativa.

    ## Criterios de aceptación

    1. Marcadores diferenciados.
2. Filtros sincronizados.
3. Lista accesible.
4. Fallo proveedor manejado.

    ## Referencias

    - RF-CLI-006

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
