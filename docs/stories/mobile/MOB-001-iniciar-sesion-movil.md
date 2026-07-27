# MOB-001 — Iniciar sesión móvil

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Acceso  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** iniciar sesión  
    **Para** acceder a mi jornada

    ## Alcance

    Pantalla Flutter y sesión segura.

    ## Criterios de aceptación

    1. Credenciales válidas.
2. Error neutral.
3. Token en secure storage.
4. Datos locales segregados.

    ## Referencias

    - RF-AUT-001

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
