# MOB-027 — Proteger datos locales

    **Área:** Mobile  
    **Tipo:** Historia de usuario  
    **Épica:** Seguridad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** vendedor  
    **Quiero** mantener datos protegidos  
    **Para** evitar exposición

    ## Alcance

    Secure storage y segregación.

    ## Criterios de aceptación

    1. Tokens protegidos.
2. Base por usuario/tenant.
3. Logout aplica política.
4. Logs seguros.

    ## Referencias

    - RNF-004
- RNF-007

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

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `EN-015` — Definir persistencia local y sincronización móvil; `MOB-001` — Iniciar sesión móvil
- **Historias consecuentes que habilita:** `INT-003` — Autenticación móvil completa; `MOB-004` — Descargar ruta del día; `MOB-015` — Recuperar visita activa tras reinicio; `MOB-019` — Consultar catálogo offline; `MOB-028` — Recuperar cola tras cierre forzado
- **Validación vertical:** `INT-003` — Autenticación móvil completa

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** Threat model, matriz de autorización y pruebas BOLA/replay/tenant.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Identificadores, tenant/propietario, estado, timestamps de negocio y auditoría aplicables.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: permisos, aislamiento multiempresa, concurrencia, recuperación y observabilidad.

## Fuera de alcance

- capacidades no descritas en el alcance y cambios de arquitectura sin ADR.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
