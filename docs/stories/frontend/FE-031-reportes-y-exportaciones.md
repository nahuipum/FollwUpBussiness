# FE-031 — Reportes y exportaciones

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Reportes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** generar reportes  
    **Para** analizar resultados

    ## Alcance

    Vistas y descargas.

    ## Criterios de aceptación

    1. Estado generación.
2. Filtros.
3. Expiración.
4. Sin datos ajenos.

    ## Referencias

    - RF-REP-002..005

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
