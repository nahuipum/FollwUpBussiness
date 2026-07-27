# BE-036 — Finalizar visita

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** cerrar visita  
    **Para** registrar resultado

    ## Alcance

    Cerrar y calcular duración.

    ## Criterios de aceptación

    1. Resultado obligatorio.
2. Comentario según resultado.
3. Hora/coordenada final.
4. Evento visit.completed.

    ## Referencias

    - RF-VIS-005
- RF-VIS-010
- HU-041

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
