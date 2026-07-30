# EN-012 — Bootstrap controlado del superadministrador de plataforma

**Área:** Backend  
**Tipo:** Enabler técnico  
**Versión:** v1.2
**Estado:** Activa
**Sprint:** S00 — Fundaciones y decisiones
**Depende de:** EN-010, EN-011
**Desbloquea:** BE-003
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Provisionar de forma controlada, auditable e idempotente el primer usuario con el rol `PLATFORM_SUPERADMIN`, para eliminar la dependencia circular entre autenticación y creación de empresas.

## Alcance

- Un mecanismo local y explícito, definido mediante ADR, para crear el primer superadministrador.
- Variables locales obligatorias y no versionadas para la identidad inicial.
- Contraseña almacenada exclusivamente mediante hash seguro.
- Garantías de ejecución única o idempotente, con evidencia reproducible.
- Procedimiento documentado para el operador de plataforma.

## Criterios de aceptación

1. El bootstrap solo puede ejecutarse mediante el mecanismo controlado documentado; no existe endpoint público de registro.
2. El usuario creado tiene únicamente el rol `PLATFORM_SUPERADMIN` y no se asocia a una empresa cliente.
3. La contraseña no se registra ni se persiste en texto plano.
4. Una segunda ejecución no crea cuentas privilegiadas adicionales ni eleva privilegios de una cuenta existente.
5. El procedimiento cuenta con pruebas, auditoría segura y evidencia reproducible.

## Fuera de alcance

- Registro público, gestión cotidiana de usuarios o creación de administradores de empresa.
- Autenticación, sesiones, recuperación de contraseña, roles personalizados y permisos por recurso.
- Bootstrap de producción por valores por defecto o secretos versionados.

## Dependencias y desbloqueos

- Depende de EN-010 y EN-011.
- Desbloquea BE-003 en un entorno vacío.

## Referencias

- Tipos de usuario 6.4
- RNF-005
- RNF-006
- RNF-008

## Seguridad y privacidad

- No incluir valores predeterminados de superadministrador, correos ni contraseñas en el repositorio.
- No aceptar identidad, rol o tenant desde una petición HTTP no autenticada.
- La documentación debe explicar cómo retirar o rotar los secretos locales usados para el bootstrap.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 0 — Fundaciones y decisiones.
- **Predecesoras obligatorias:** `EN-010` — Configurar Spring Security y gestión local de secretos; `EN-011` — Definir catálogo de roles base
- **Historias consecuentes que habilita:** `BE-003` — Autenticar usuario
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
