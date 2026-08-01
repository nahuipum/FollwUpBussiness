# EN-013 — Definir autenticación, sesiones y recuperación

**Área:** Arquitectura / Backend
**Tipo:** Enabler técnico
**Épica:** Identidad
**Prioridad:** Must Have
**Fase:** MVP

## Objetivo

Definir mediante ADR el mecanismo de autenticación, renovación, revocación,
expiración, activación inicial y recuperación de contraseña que compartirán web
y mobile.

## Criterios de aceptación

1. El ADR define formato y duración de credenciales de acceso y renovación.
2. Se define rotación, revocación, cierre de sesión y respuesta ante robo o
   reutilización.
3. Se define el primer acceso sin contraseñas predeterminadas ni registro
   público.
4. Se define recuperación con token de un solo uso, expiración y respuesta
   neutral.
5. Se documentan almacenamiento web/mobile, CSRF cuando aplique, rate limiting,
   auditoría y migración/rollback.
6. Backend, Frontend, Mobile, QA y Seguridad aprueban la consumibilidad antes de
   implementar BE-003 a BE-006.

## Fuera de alcance

- Implementar endpoints o pantallas.
- Elegir el proveedor de notificaciones; corresponde a EN-017.

## Dependencias y desbloqueos

- Depende de EN-010 y EN-011.
- Desbloquea BE-003, BE-004, BE-005, BE-006, FE-001 a FE-003 y MOB-001 a
  MOB-002.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-010` — Configurar Spring Security y gestión local de secretos; `EN-011` — Definir catálogo de roles base
- **Historias consecuentes que habilita:** `BE-003` — Autenticar usuario; `BE-004` — Renovar sesión; `BE-006` — Recuperar contraseña; `EN-015` — Definir persistencia local y sincronización móvil; `EN-017` — Definir canales de notificación; `FE-001` — Pantalla de inicio de sesión; `FE-002` — Recuperación de contraseña; `MOB-001` — Iniciar sesión móvil
- **Validación vertical:** La validación se incorpora a la historia E2E de la épica y a la regresión `INT-032` cuando afecte el flujo crítico.

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
