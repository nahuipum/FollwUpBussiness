# FE-012 — Carga de clientes

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Importaciones  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** importar archivo  
    **Para** acelerar configuración

    ## Alcance

    Flujo de upload.

    ## Criterios de aceptación

    1. Plantilla descargable.
2. Valida extensión/tamaño.
3. Progreso.
4. Evita doble envío.

    ## Referencias

    - RF-CLI-004

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
