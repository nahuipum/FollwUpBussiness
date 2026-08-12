# FE-043 — Corregir y reenviar invitación pendiente

**Área:** Frontend  
**Tipo:** Historia de usuario  
**Épica:** Usuarios  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** administrador de empresa  
**Quiero** corregir y reenviar la invitación de un administrador o supervisor pendiente  
**Para** reparar datos equivocados sin duplicar cuentas

## Alcance

Extender la vista existente de Administradores y supervisores. Para una fila
INVITED, reemplazar la acción visual Editar por Corregir y reenviar invitación.
El diálogo reutiliza el formulario actual, envía todos los campos del contrato y
llama a POST /company/users/{userId}/invitation con If-Match. No se rediseña la
tabla ni se crea un segundo flujo de alta.

## Criterios de aceptación

1. Solo COMPANY_ADMIN visualiza y puede ejecutar la acción; el Backend mantiene la autorización.
2. La acción aparece exclusivamente en filas INVITED; las filas ACTIVE conservan Editar y las filas bloqueadas/inactivas conservan sus acciones contractuales de estado.
3. El formulario permite corregir nombre, usuario opcional, correo y rol cerrado (COMPANY_ADMIN o SUPERVISOR) según el request; nunca ofrece rol de plataforma.
4. Al confirmar, usa la versión vigente y no muestra token, enlace, contraseña, sesión ni credenciales.
5. Un 202 actualiza la misma fila, conserva filtros/paginación y confirma que se envió una nueva invitación sin afirmar entrega final.
6. 401, 403, 404, 409, 422, 503, doble envío, cancelación, respuesta obsoleta y cambio de sesión siguen FE-034 sin dejar un éxito local falso.

## Referencias

- HU-003
- RF-AUT-006
- BE-063
- FE-004

## Seguridad y privacidad

- No enviar tenantId, token o enlace; el recurso procede de la lista autorizada.
- Limpiar formulario, usuario seleccionado, resultados y errores ante logout o cambio de empresa/identidad.

## Evidencia mínima para DoF

- Pruebas de fila INVITED, reenvío válido, conflicto, sin permiso, fallo de entrega y ausencia de acción para estados no invitados.
- QA independiente y revisión de seguridad.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** BE-063 — Corregir y reenviar invitación de usuario; FE-004 — Gestión de usuarios y roles; FE-003 — Gestión de sesión; FE-034 — Manejo global de errores y permisos.
- **Historias consecuentes que habilita:** ampliar INT-033 — Gestión de supervisores y equipo E2E.
- **Validación vertical:** INT-033 con invitación corregida antes de activación.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI POST /company/users/{userId}/invitation y CorrectCompanyUserInvitationRequest.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos:** fila INVITED, versión, nombre, usuario, correo y rol permitidos.
- La acción no sustituye bloquear: bloquear una invitación sigue cancelándola y no habilita esta corrección.

## Fuera de alcance

- Reenviar invitación de cuenta bloqueada, edición de cuentas activas, gestión de vendedores, eliminación, roles personalizados y exponer tokens/enlaces.

## Puerta de Ready para esta historia

- BE-063 y contrato disponibles; pruebas de acciones por estado y manejo de conflicto preparadas.
<!-- delivery-traceability:end -->
