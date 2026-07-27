# BE-041 — Gestionar productos

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Catálogo  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** mantener productos  
    **Para** registrar ventas

    ## Alcance

    CRUD con estado lógico.

    ## Criterios de aceptación

    1. Código único.
2. Precio válido.
3. Inactivo no se usa.
4. Auditoría.

    ## Referencias

    - RF-VTA-003
- Modelo Producto

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
