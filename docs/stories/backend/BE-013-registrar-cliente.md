# BE-013 — Registrar cliente

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Clientes  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear un cliente geolocalizado  
    **Para** incluirlo en rutas

    ## Alcance

    Persistir datos y punto PostGIS.

    ## Criterios de aceptación

    1. Valida datos y coordenadas.
2. SRID correcto.
3. Advierte duplicados.
4. Queda disponible si activo.

    ## Referencias

    - RF-CLI-001
- RF-CLI-002
- HU-010

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
