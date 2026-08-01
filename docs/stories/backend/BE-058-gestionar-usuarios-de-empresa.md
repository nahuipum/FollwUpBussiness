# BE-058 — Gestionar usuarios de empresa

**Área:** Backend
**Tipo:** Historia de usuario
**Épica:** Identidad
**Prioridad:** Must Have
**Fase:** MVP

## Historia

**Como** administrador de empresa
**Quiero** listar, invitar, editar, bloquear y reactivar usuarios de mi empresa
**Para** administrar supervisores y administradores sin intervención de
plataforma

## Alcance

Usuarios `COMPANY_ADMIN` y `SUPERVISOR`; el vendedor se crea mediante BE-008.
La invitación reutiliza el flujo seguro de activación/recuperación de BE-006.

## Criterios de aceptación

1. Solo se consultan y modifican usuarios del tenant autenticado.
2. No se puede asignar `PLATFORM_SUPERADMIN` ni un rol arbitrario.
3. Bloquear un usuario revoca sus sesiones y conserva su historial.
4. Correo o nombre de usuario es único según el contrato de identidad.
5. No se puede dejar a una empresa activa sin ningún administrador utilizable.
6. Alta, cambios de rol/estado y reactivación quedan auditados.

## Fuera de alcance

- Roles personalizados.
- Crear vendedores o cambiar relaciones supervisor-vendedor.
- Registro público.

## Referencias

- RF-AUT-003
- RF-AUT-005
- RN-001
- RN-002

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-006` — Recuperar contraseña; `BE-007` — Gestionar roles y permisos; `BE-051` — Registrar acciones críticas; `BE-057` — Provisionar administrador inicial de empresa
- **Historias consecuentes que habilita:** `BE-008` — Crear vendedor; `BE-011` — Asignar supervisor; `BE-041` — Gestionar productos; `BE-062` — Gestionar zonas y territorios; `FE-004` — Gestión de usuarios y roles; `INT-033` — Gestión de supervisores y equipo E2E
- **Validación vertical:** `INT-033` — Gestión de supervisores y equipo E2E

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
