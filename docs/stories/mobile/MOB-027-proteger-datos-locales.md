# MOB-027 — Proteger datos locales

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Seguridad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** mantener datos protegidos  
    **Para** evitar exposición

    ## Alcance

    Secure storage y segregación.

    ## Criterios de aceptación

    1. Tokens protegidos.
2. Base por usuario/tenant.
3. Logout aplica política.
4. Logs seguros.

    ## Referencias

    - RNF-004
- RNF-007

    ## Seguridad y privacidad

    - Usar almacenamiento seguro.
- Rastrear solo durante jornada activa.

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
