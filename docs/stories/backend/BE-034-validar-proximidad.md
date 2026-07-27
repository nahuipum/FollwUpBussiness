# BE-034 — Validar proximidad

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** saber si estoy en geocerca  
    **Para** marcar visita

    ## Alcance

    Calcular distancia con PostGIS.

    ## Criterios de aceptación

    1. Radio configurable.
2. Valida precisión y antigüedad.
3. Devuelve distancia.
4. Cliente autorizado.

    ## Referencias

    - RF-VIS-001
- RN-005
- RN-006

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
