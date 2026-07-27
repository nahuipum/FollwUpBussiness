# FE-024 — Detalle de visita

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Visitas  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador o supervisor  
    **Quiero** ver evidencia  
    **Para** auditar visita

    ## Alcance

    Ficha con geografía y resultado.

    ## Criterios de aceptación

    1. Inicio/fin.
2. Precisión.
3. Correcciones.
4. Permisos.

    ## Referencias

    - RF-VIS-003
- RF-VIS-005
- RF-VIS-008

    ## Seguridad y privacidad

    - No usar ocultamiento visual como único control.
- Limpiar cache y estado al cerrar sesión.

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
