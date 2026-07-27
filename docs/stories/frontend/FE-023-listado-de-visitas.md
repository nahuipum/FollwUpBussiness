# FE-023 — Listado de visitas

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** consultar visitas  
    **Para** validar cumplimiento

    ## Alcance

    Tabla filtrable.

    ## Criterios de aceptación

    1. Filtros.
2. Duración/resultado.
3. Fuera de ruta.
4. Detalle.

    ## Referencias

    - RF-VIS-009
- HU-043

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
