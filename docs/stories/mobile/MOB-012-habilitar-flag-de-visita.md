# MOB-012 — Habilitar flag de visita

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Geocerca  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** habilitar botón dentro de geocerca  
    **Para** registrar visita

    ## Alcance

    Estado derivado de jornada y GPS.

    ## Criterios de aceptación

    1. Fuera deshabilitado.
2. Dentro habilitable.
3. Ubicación inválida deshabilita.
4. Evita doble toque.

    ## Referencias

    - RF-VIS-002
- HU-040

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
