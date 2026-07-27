# FE-028 — Resultados por vendedor

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** supervisor  
    **Quiero** comparar vendedores  
    **Para** medir desempeño

    ## Alcance

    Métricas y periodos.

    ## Criterios de aceptación

    1. Monto/compradores/conversión/ticket.
2. Equipo.
3. Periodo.
4. Sin datos.

    ## Referencias

    - RF-VTA-009
- HU-053

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
