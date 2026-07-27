# FE-001 — Pantalla de inicio de sesión

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario  
    **Quiero** iniciar sesión desde la web  
    **Para** acceder al panel

    ## Alcance

    Formulario React y estados de autenticación.

    ## Criterios de aceptación

    1. Valida campos.
2. Error genérico.
3. No expone contraseña.
4. Redirige según rol.

    ## Referencias

    - RF-AUT-001

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
