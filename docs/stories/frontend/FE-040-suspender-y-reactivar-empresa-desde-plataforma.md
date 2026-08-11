# FE-040 — Suspender y reactivar empresa desde plataforma

**Área:** Frontend  
**Tipo:** Historia de usuario  
**Épica:** Base SaaS  
**Prioridad:** Must Have  
**Fase:** MVP

## Historia

**Como** superadministrador de plataforma  
**Quiero** suspender o reactivar una empresa  
**Para** controlar su acceso sin perder su información histórica

## Alcance

Desde la gestión de empresas, permitir solicitar el cambio entre `ACTIVE` y `SUSPENDED` mediante `PATCH /platform/companies/{companyId}/status`. La acción debe requerir confirmación explícita, informar su efecto sobre el acceso y actualizar el estado mostrado al completarse.

## Criterios de aceptación

1. Solo una sesión con `PLATFORM_SUPERADMIN` puede ver e invocar las acciones; el Backend mantiene la autoridad.
2. Una empresa activa ofrece la acción **Suspender** y una suspendida la acción **Reactivar**; no se presenta una transición incompatible.
3. Antes de suspender, la interfaz exige confirmación e informa que se bloquearán nuevas sesiones y renovaciones de la empresa; no ofrece eliminar datos ni restaurar sesiones.
4. Tras una respuesta exitosa, se actualizan el estado, los filtros y las acciones disponibles sin perder la búsqueda o paginación vigente.
5. `401`, `403`, `404` y `409` siguen FE-034, no muestran datos de otro tenant y solo conservan el `correlationId` de la solicitud vigente.
6. Carga, cancelación, fallo de red y doble envío no dejan la acción en curso ni muestran un éxito no confirmado.

## Referencias

- Tipos de usuario 6.4
- RN-001, RN-002
- BE-002
- INT-038

## Seguridad y privacidad

- La empresa destino procede exclusivamente del recurso listado o consultado autorizado; el cliente no envía `tenantId` ni actor.
- No mostrar ni registrar sesiones, tokens, credenciales o datos personales completos.
- La suspensión/reactivación queda auditada por el Backend; la UI no la sustituye ni infiere éxito localmente.

## Observabilidad

- Propagar y mostrar `correlationId` según FE-034 cuando aplique.
- Registrar resultado técnico sin secretos ni datos personales completos.

## Evidencia mínima para DoF

- Pruebas de transición `ACTIVE → SUSPENDED`, `SUSPENDED → ACTIVE`, cancelación, conflicto y permiso denegado.
- QA independiente, revisión de seguridad y validación vertical mediante INT-038.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Sprint objetivo:** Sprint 1 — Empresa, identidad y acceso utilizable.
- **Predecesoras obligatorias:** `BE-002` — Suspender y reactivar empresa; `FE-003` — Gestión de sesión; `FE-034` — Manejo global de errores y permisos.
- **Historias consecuentes que habilita:** `INT-038` — Suspensión y reactivación de empresa E2E.
- **Validación vertical:** `INT-038` — Suspensión y reactivación de empresa E2E.

## Contratos y superficies

- **Debe estar listo antes de desarrollar:** OpenAPI `PATCH /platform/companies/{companyId}/status`, con transición, errores y auditoría ya definidos por BE-002.
- El contrato no puede modificarse silenciosamente para acomodar una implementación.

## Datos, reglas y casos límite

- **Datos mínimos:** identificador, nombre visible, estado y `correlationId` aplicable.
- Casos mínimos: permiso denegado, empresa inexistente, transición repetida o concurrente, cambio de sesión y red degradada.
- La reactivación habilita futuros inicios de sesión; no recupera ni crea sesiones, refresh tokens o credenciales desde el panel.

## Fuera de alcance

- Edición de empresa, planes comerciales, administración de usuarios de empresa, soporte de tenant y auditoría de plataforma.

## Puerta de Ready para esta historia

- BE-002 y su contrato están disponibles; la matriz criterio → prueba está preparada.
- Si la semántica de una transición o de revocación cambia, se actualiza primero el contrato y la validación vertical.
<!-- delivery-traceability:end -->

