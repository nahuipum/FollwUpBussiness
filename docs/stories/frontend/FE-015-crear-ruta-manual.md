# FE-015 — Crear ruta manual

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear ruta  
    **Para** programar visitas

    ## Alcance

    Selector de fecha, vendedor, clientes y orden.

    ## Criterios de aceptación

    1. Agregar/quitar.
2. Reordenar accesiblemente.
3. Guardar borrador.
4. Validar publicación.

    ## Referencias

    - RF-RUT-001
- HU-020

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
