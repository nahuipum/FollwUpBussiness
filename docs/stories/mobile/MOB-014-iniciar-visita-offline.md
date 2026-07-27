# MOB-014 — Iniciar visita offline

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** registrar sin internet  
    **Para** continuar trabajo

    ## Alcance

    Comando local UUID.

    ## Criterios de aceptación

    1. Fecha/coordenadas.
2. Pendiente.
3. Sobrevive reinicio.
4. No duplica.

    ## Referencias

    - HU-042
- RNF-012
- RNF-013

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
