# MOB-019 — Consultar catálogo offline

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Ventas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** ver productos  
    **Para** registrar ventas

    ## Alcance

    Catálogo local.

    ## Criterios de aceptación

    1. Disponible offline.
2. Última sync.
3. Inactivos no nuevos.
4. Vacío manejado.

    ## Referencias

    - RF-VTA-003

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
