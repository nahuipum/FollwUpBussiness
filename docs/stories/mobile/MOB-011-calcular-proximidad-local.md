# MOB-011 — Calcular proximidad local

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Geocerca  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** saber si estoy cerca  
    **Para** preparar marcaje

    ## Alcance

    Cálculo local de ayuda.

    ## Criterios de aceptación

    1. Radio configurado.
2. Precisión/antigüedad.
3. Distancia aproximada.
4. Servidor valida.

    ## Referencias

    - RF-VIS-001
- RF-VIS-002

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
