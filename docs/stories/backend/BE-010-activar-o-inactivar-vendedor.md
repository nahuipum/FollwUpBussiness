# BE-010 — Activar o inactivar vendedor

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Workforce  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** cambiar estado  
    **Para** controlar acceso

    ## Alcance

    Inactivación lógica.

    ## Criterios de aceptación

    1. Inactivo no inicia sesión.
2. No recibe rutas nuevas.
3. Historial permanece.
4. Acción auditada.

    ## Referencias

    - RF-VEN-003
- RN-013

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
