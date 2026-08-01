# BE-007 — Gestionar roles y permisos

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** administrador  
    **Quiero** asignar roles y permisos  
    **Para** restringir funciones

    ## Alcance

    Implementar roles y autorización por recurso.

    ## Dependencias

    - EN-010 — Configurar Spring Security y gestión local de secretos.
    - EN-011 — Definir catálogo de roles base.
    - BE-003 — Autenticar usuario.
    - BE-008 — Crear vendedor, para validar el alcance propio del vendedor.
    - BE-011 — Asignar supervisor, para validar el alcance del equipo del supervisor.

    ## Criterios de aceptación

    1. Endpoint valida permiso.
2. Supervisor solo su equipo.
3. Vendedor solo su información.
4. Cambio auditado.

    ## Referencias

    - RF-AUT-003
- RNF-006

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

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `EN-011` — Definir catálogo de roles base
- **Historias consecuentes que habilita:** `BE-001` — Crear una empresa; `BE-051` — Registrar acciones críticas; `BE-057` — Provisionar administrador inicial de empresa; `BE-058` — Gestionar usuarios de empresa; `FE-034` — Manejo global de errores y permisos; `INT-002` — Autenticación web completa; `INT-024` — Aislamiento multiempresa E2E
- **Validación vertical:** `INT-002` — Autenticación web completa; `INT-024` — Aislamiento multiempresa E2E

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** ADR de autenticación; OpenAPI `/auth/*` y `/company/users`; política de errores.
- El contrato no puede modificarse silenciosamente para acomodar una
  implementación; Backend, consumidores y QA de contrato deben revisarlo.

## Datos, reglas y casos límite

- **Datos mínimos de la capacidad:** Usuario, rol, permiso, tenant, sesión/credencial, expiración, revocación y token de activación/recuperación.
- El modelo persistente, cache, mensajes, almacenamiento local y sus consultas
  deben conservar `tenantId`/propiedad de empresa cuando aplique.
- El backend es autoridad de reglas; web y mobile solo anticipan validaciones
  para experiencia de usuario.
- Casos mínimos adicionales: sin datos, sin permiso, recurso inactivo,
  petición repetida o concurrente, dependencia degradada y cambio de tenant o
  usuario.

## Riesgos conocidos

- QA y Seguridad deben cubrir: enumeración de cuentas, escalación de privilegios, sesión robada y cruce de tenant.

## Fuera de alcance

- registro público, roles arbitrarios y autenticación social.

## Puerta de Ready para esta historia

- Dependencias anteriores terminadas o con contrato estable y mock acordado.
- Reglas, datos, permisos y estados definidos; no se acepta una pantalla cuyo
  único resultado posible sea vacío por falta de una historia productora.
- Contrato actualizado antes del handoff y matriz criterio → prueba preparada.
- Si una decisión de arquitectura o producto sigue abierta, la historia queda
  fuera del sprint hasta cerrar el enabler correspondiente.
<!-- delivery-traceability:end -->
