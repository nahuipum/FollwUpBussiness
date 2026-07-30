# BE-006 — Recuperar contraseña

    **Área:** Backend  
    **Tipo:** Historia de usuario  
    **Épica:** Identidad  
    **Prioridad:** Must Have  
    **Fase:** MVP  

    ## Historia

    **Como** usuario registrado  
    **Quiero** restablecer mi contraseña  
    **Para** recuperar acceso

    ## Alcance

    Token temporal de un solo uso para activación inicial y recuperación,
    entregado mediante el canal aprobado en EN-017.

    ## Criterios de aceptación

    1. La solicitud siempre devuelve una respuesta neutral y aplica rate limit.
2. El token es aleatorio, de un solo uso, expira y se almacena de forma segura.
3. La contraseña cumple la política y no aparece en URL posterior, logs ni
   auditoría.
4. Al completar recuperación se pueden revocar las sesiones previas según
   EN-013.
5. El mismo flujo activa una cuenta invitada sin contraseña predeterminada.
6. Entrega fallida es observable y permite reintento controlado sin duplicación
   desbordada.

    ## Referencias

    - RF-AUT-002

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
- **Predecesoras obligatorias:** `BE-003` — Autenticar usuario; `EN-013` — Definir autenticación, sesiones y recuperación; `EN-017` — Definir canales de notificación
- **Historias consecuentes que habilita:** `BE-057` — Provisionar administrador inicial de empresa; `BE-058` — Gestionar usuarios de empresa; `FE-002` — Recuperación de contraseña; `INT-001` — Onboarding completo de empresa; `INT-002` — Autenticación web completa
- **Validación vertical:** `INT-001` — Onboarding completo de empresa; `INT-002` — Autenticación web completa

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
