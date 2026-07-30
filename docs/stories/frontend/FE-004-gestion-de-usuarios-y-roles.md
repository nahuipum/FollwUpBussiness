# FE-004 — Gestión de usuarios y roles

    **Área:** Frontend  
    **Tipo:** Historia de usuario  
    **Épica:** Usuarios  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** administrar usuarios  
    **Para** controlar accesos

    ## Alcance

    Lista, alta, edición y bloqueo.

    ## Criterios de aceptación

    1. Permisos.
2. Estado visible.
3. Confirmación bloqueo.
4. Lista actualizada.

    ## Referencias

    - RF-AUT-003
- RF-AUT-005

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

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-058` — Gestionar usuarios de empresa; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos
- **Historias consecuentes que habilita:** `INT-033` — Gestión de supervisores y equipo E2E
- **Validación vertical:** `INT-033` — Gestión de supervisores y equipo E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `/company/users`; catálogo de roles y autorización por recurso.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Usuario de empresa, roles base, estado, invitación y sesiones revocadas.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: elevación de rol, último administrador bloqueado y sesiones no revocadas.

## Fuera de alcance

- roles personalizados y usuarios de plataforma administrados por un tenant.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
