# BE-025 — Reasignar ruta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** reasignar ruta  
    **Para** resolver cambios

    ## Alcance

    Cambiar vendedor conservando ejecución.

    ## Criterios de aceptación

    1. Nuevo vendedor activo.
2. No pierde visitas.
3. Notifica.
4. Audita anterior/nuevo.

    ## Referencias

    - RF-RUT-009
- RN-019
- HU-022

    ## Seguridad y privacidad

    - Validar tenant y autorización por recurso.
- No registrar secretos ni datos personales completos.

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
