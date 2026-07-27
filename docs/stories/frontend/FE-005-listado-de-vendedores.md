# FE-005 — Listado de vendedores

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Vendedores  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** consultar vendedores  
    **Para** gestionar equipo

    ## Alcance

    Tabla con filtros.

    ## Criterios de aceptación

    1. Paginación.
2. Filtros.
3. Vacío/error.
4. Tenant.

    ## Referencias

    - RF-VEN-001..005

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
