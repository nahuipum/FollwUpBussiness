# BE-054 — Configurar geocerca y tracking

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Configuración  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** ajustar radio y frecuencia  
    **Para** adaptar operación

    ## Alcance

    Endpoint de parámetros.

    ## Criterios de aceptación

    1. Límites válidos.
2. Aplica a nuevas validaciones.
3. Permisos.
4. Auditoría.

    ## Referencias

    - RN-006
- RF-UBI-003

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
