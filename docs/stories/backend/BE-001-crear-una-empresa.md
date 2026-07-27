# BE-001 — Crear una empresa

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Base SaaS  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** superadministrador  
    **Quiero** crear una empresa con configuración inicial  
    **Para** habilitar un nuevo tenant

    ## Alcance

    Persistir empresa, estado, zona horaria, radio de geocerca y frecuencia de ubicación.

    ## Criterios de aceptación

    1. Se crea un identificador único.
2. La configuración se valida.
3. Los datos quedan aislados.
4. La creación se audita.

    ## Referencias

    - Empresa 14.1
- RN-001
- RN-002

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
