# BE-014 — Editar cliente y ubicación

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** corregir cliente  
    **Para** mantener precisión

    ## Alcance

    Actualizar datos con auditoría.

    ## Criterios de aceptación

    1. Coordenadas válidas.
2. Registra anterior y nuevo.
3. No rompe historial.
4. Permiso requerido.

    ## Referencias

    - RF-CLI-005
- RF-AUD-001

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
