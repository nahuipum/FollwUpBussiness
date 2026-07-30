# BE-005 — Cerrar y revocar sesión

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario autenticado  
    **Quiero** cerrar mi sesión  
    **Para** evitar reutilización

    ## Alcance

    Invalidar sesión y limpiar presencia asociada.

    ## Criterios de aceptación

    1. Logout invalida sesión.
2. Usuario bloqueado pierde acceso.
3. No afecta otros tenants.
4. Se audita.

    ## Referencias

    - RF-AUT-004
- RF-AUT-005

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
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `BE-004` — Renovar sesión
- **Historias consecuentes que habilita:** `BE-002` — Suspender y reactivar empresa; `BE-010` — Activar o inactivar vendedor; `FE-003` — Gestión de sesión; `INT-002` — Autenticación web completa; `INT-003` — Autenticación móvil completa; `INT-038` — Suspensión y reactivación de empresa E2E; `MOB-002` — Renovar y cerrar sesión
- **Validación vertical:** `INT-002` — Autenticación web completa; `INT-003` — Autenticación móvil completa; `INT-038` — Suspensión y reactivación de empresa E2E

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
