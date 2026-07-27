# BE-037 — Registrar visita fuera de ruta

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor autorizado  
    **Quiero** registrar visita no planificada  
    **Para** aprovechar oportunidad

    ## Alcance

    Crear visita fuera de ruta.

    ## Criterios de aceptación

    1. Configuración permite.
2. Geocerca se mantiene.
3. Marca fuera de ruta.
4. Auditoría.

    ## Referencias

    - RF-VIS-007

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
