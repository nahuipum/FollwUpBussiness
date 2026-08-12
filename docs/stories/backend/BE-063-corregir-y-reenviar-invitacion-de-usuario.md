# BE-063 — Corregir y reenviar invitación de usuario

**Área:** Backend  
**Tipo:** Historia de usuario  
**Épica:** Identidad  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** administrador de empresa  
**Quiero** corregir y reenviar una invitación pendiente  
**Para** subsanar un correo, nombre de usuario o rol equivocado sin crear una cuenta duplicada

## Alcance

Operación exclusiva para una cuenta INVITED de la empresa autenticada. Actualiza
en la misma cuenta displayName, username, email y el rol permitido, invalida el
token de activación previo, crea uno nuevo de un solo uso y solicita una nueva
entrega. No crea otra cuenta ni relaja la unicidad tenant-scoped.

## Criterios de aceptación

1. Solo COMPANY_ADMIN de la empresa autenticada puede corregir una invitación de su propio tenant.
2. Solo una cuenta en estado INVITED puede corregirse; cualquier otro estado responde 409 sin efectos.
3. Correo y nombre de usuario conservan unicidad por empresa y excluyen la misma cuenta de la comparación; un conflicto responde 409 sin efectos.
4. Con If-Match vigente se actualizan la misma cuenta, el rol permitido y un nuevo token opaco de activación; el token anterior queda inválido.
5. Cuenta, sustitución de token, auditoría y solicitud durable de notificación confirman en una misma frontera transaccional; la entrega externa ocurre después del commit.
6. Nunca se retorna ni registra token, enlace, contraseña, refresh, CSRF o credenciales.
7. La respuesta 202 devuelve solo el usuario actualizado; conflictos, versión obsoleta, fallo durable o entrega no disponible no confirman un cambio parcial.

## Referencias

- HU-003
- RF-AUT-006
- RN-001, RN-002
- BE-006, BE-051, BE-058

## Seguridad y privacidad

- El tenant y actor proceden exclusivamente de la sesión autenticada.
- La cuenta objetivo se verifica dentro del tenant antes de leer o mutar.
- El token de activación es opaco, de un uso y solo llega al canal de entrega posterior al commit.

## Observabilidad

- Propagar correlationId.
- Auditar actor, tenant, operación, recurso, resultado y estados permitidos; omitir correo, usuario, token y enlace.

## Evidencia mínima para DoF

- Pruebas de corrección válida, email/username duplicado, versión obsoleta, cross-tenant, estado no INVITED, token previo inválido y rollback ante fallo de auditoría/notificación durable.
- QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** BE-006 — Recuperar contraseña; BE-007 — Gestionar roles y permisos; BE-051 — Registrar acciones críticas; BE-058 — Gestionar usuarios de empresa.
- **Historias consecuentes que habilita:** FE-043 — Corregir y reenviar invitación pendiente.
- **Validación vertical:** ampliar INT-033 con correo o rol erróneo antes de activar.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** POST /company/users/{userId}/invitation, CorrectCompanyUserInvitationRequest, If-Match y los contratos de token/notificación de BE-006.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos:** usuario INVITED, versión, datos funcionales, rol cerrado, tenant, actor y correlación.
- Un reenvío sin cambios sigue reemplazando el token anterior y emite uno nuevo.
- Una cuenta bloqueada es una invitación cancelada: no se reactiva ni se corrige por esta operación; requiere una capacidad futura explícita si negocio la necesita.

## Fuera de alcance

- Editar cuentas ACTIVE (BE-058), reactivar cuentas bloqueadas/inactivas, roles arbitrarios, vendedores, registro público y devolver enlaces/tokens.

## Puerta de Ready para esta historia

- Contrato de token y notificación de BE-006 disponible; matriz de efectos transaccionales y pruebas de cierre preparada.
<!-- delivery-traceability:end -->
