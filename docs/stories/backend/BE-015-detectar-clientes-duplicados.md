# BE-015 — Detectar clientes duplicados

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** recibir candidatos duplicados  
    **Para** evitar registros repetidos

    ## Alcance

    Comparar código, documento, teléfono, dirección, nombre y proximidad.

    ## Criterios de aceptación

    1. Devuelve candidatos y razones.
2. Respeta tenant.
3. Proximidad usa PostGIS.
4. Permite decisión autorizada.

    ## Referencias

    - RN-015

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
