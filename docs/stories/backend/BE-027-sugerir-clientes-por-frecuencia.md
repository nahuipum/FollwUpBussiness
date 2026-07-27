# BE-027 — Sugerir clientes por frecuencia

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** recibir clientes pendientes  
    **Para** cumplir frecuencia

    ## Alcance

    Calcular candidatos por última visita.

    ## Criterios de aceptación

    1. Frecuencias soportadas.
2. Excluye inactivos.
3. Respeta zona.
4. Explica sugerencia.

    ## Referencias

    - RF-RUT-011

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
