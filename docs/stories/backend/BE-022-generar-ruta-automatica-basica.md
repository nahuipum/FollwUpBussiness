# BE-022 — Generar ruta automática básica

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Rutas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** obtener secuencia eficiente  
    **Para** reducir planificación

    ## Alcance

    Proponer orden por distancia y restricciones.

    ## Criterios de aceptación

    1. Punto inicio/fin.
2. Máximo clientes.
3. Estimaciones.
4. No publica automáticamente.

    ## Referencias

    - RF-RUT-002
- RF-RUT-003
- HU-021

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
