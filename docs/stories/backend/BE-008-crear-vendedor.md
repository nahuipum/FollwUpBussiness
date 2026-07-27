# BE-008 — Crear vendedor

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear un vendedor  
    **Para** asignarle rutas

    ## Alcance

    Persistir vendedor y usuario.

    ## Criterios de aceptación

    1. Valida obligatorios.
2. Usuario único en empresa.
3. Permite supervisor y zona.
4. Auditoría.

    ## Referencias

    - RF-VEN-001
- HU-002

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
