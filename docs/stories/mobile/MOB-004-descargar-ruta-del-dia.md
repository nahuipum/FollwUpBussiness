# MOB-004 — Descargar ruta del día

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ruta  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** descargar mi ruta  
    **Para** trabajar sin internet

    ## Alcance

    Sincronizar ruta y clientes.

    ## Criterios de aceptación

    1. Disponible offline.
2. Última sincronización.
3. No mezcla usuarios.
4. Actualiza cambios.

    ## Referencias

    - RF-RUT-007
- RF-UBI-001

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
