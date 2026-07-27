# FE-019 — Comparar ruta planificada y ejecutada

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** comparar secuencias  
    **Para** detectar desvíos

    ## Alcance

    Mapa y tabla.

    ## Criterios de aceptación

    1. Visitados/omitidos/fuera ruta.
2. Estimado/real.
3. Última actualización.
4. Alternativa al mapa.

    ## Referencias

    - RF-RUT-008

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
