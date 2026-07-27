# BE-021 — Crear ruta manual

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** crear ruta manual  
    **Para** programar visitas

    ## Alcance

    Persistir fecha, vendedor y secuencia.

    ## Criterios de aceptación

    1. Fecha y vendedor obligatorios.
2. Orden editable.
3. Estado borrador.
4. Sin clientes ajenos.

    ## Referencias

    - RF-RUT-001
- HU-020

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
