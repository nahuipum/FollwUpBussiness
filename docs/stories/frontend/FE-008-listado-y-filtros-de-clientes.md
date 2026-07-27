# FE-008 — Listado y filtros de clientes

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** consultar clientes  
    **Para** encontrar cartera

    ## Alcance

    Tabla paginada y filtros.

    ## Criterios de aceptación

    1. Filtros requeridos.
2. Paginación.
3. Permisos supervisor.
4. Estados completos.

    ## Referencias

    - RF-CLI-007

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
