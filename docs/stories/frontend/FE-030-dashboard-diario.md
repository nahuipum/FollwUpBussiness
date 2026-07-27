# FE-030 — Dashboard diario

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Dashboard  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ver resumen  
    **Para** conocer operación

    ## Alcance

    Tarjetas, tablas y filtros.

    ## Criterios de aceptación

    1. Estados vendedores.
2. Visitas.
3. Ventas/conversión.
4. Permisos/estados UI.

    ## Referencias

    - RF-REP-001
- HU-060

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
