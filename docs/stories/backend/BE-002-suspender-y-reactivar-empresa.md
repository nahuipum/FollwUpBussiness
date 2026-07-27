# BE-002 — Suspender y reactivar empresa

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Base SaaS  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** superadministrador  
    **Quiero** suspender o reactivar una empresa  
    **Para** controlar el acceso

    ## Alcance

    Bloquear nuevas sesiones sin eliminar historial.

    ## Criterios de aceptación

    1. Empresa suspendida no inicia sesión.
2. Reactivación restablece acceso.
3. Historial intacto.
4. Acción auditada.

    ## Referencias

    - Tipos de usuario 6.4

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
