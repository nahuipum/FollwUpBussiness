# FE-040 — Paquete de contexto

- Estado: `CHANGES_REQUIRED` (QA).
- Candidate-ID: `505cc45 + worktree FE-040 7ae5fd29` (no consolidado; preservar cambios ajenos).
- Alcance: conectar el diseño existente de empresas al cambio real de estado; no implementar FE-041/FE-042 ni modificar Backend, OpenAPI, contratos o mockups.

## Contrato y decisiones

- `PATCH /platform/companies/{companyId}/status`, solo `PLATFORM_SUPERADMIN`; body exacto `ChangeCompanyStatusRequest`: `{ status: "ACTIVE" | "SUSPENDED", reason: string (5..500) }`; respuesta `200 Company`.
- Errores contractuales: `401`, `403`, `404`, `409`, todos con `ErrorResponse` y `correlationId`; red/response obsoleta se tratan sin éxito local.
- La empresa objetivo procede exclusivamente de la fila autorizada. Enviar solo `status` y `reason`; jamás `tenantId` ni actor.
- Invariantes: (1) solo superadministrador; (2) recurso autorizado y sin `tenantId`; (3) suspender bloquea acceso futuro sin borrar historial; (4) reactivar no crea/restaura sesiones ni credenciales; (5) éxito, rechazo, conflicto y fallo nunca dejan estado visual falso.
- Acciones: `ACTIVE → suspend`; `SUSPENDED → reactivate`. Confirmación accesible obligatoria antes de suspender; cancelación y doble envío no mutan ni dejan envío en curso. Tras `200`, actualizar la fila sin perder búsqueda, filtro ni página; refrescar de forma segura si procede.
- Aplicar el manejo FE-034 ya disponible para 401/403/404/409 y `correlationId` solo de la solicitud vigente. Ante logout/cambio de sesión limpiar diálogo, selección, estado de envío y datos transitorios.

## Superficies permitidas y evidencia

- Código previsto: `src/features/platform-companies/api.ts`, `types.ts`, `PlatformCompaniesPage.tsx`, `components/CompanyActionDialog.tsx`, y lo estrictamente imprescindible de `CompanyTable.tsx`; pruebas próximas `api.test.ts` y `PlatformCompaniesPage.test.tsx`.
- El diseño de referencia ya existe en `docs/frontendMockups/FE-040-suspender-y-reactivar-empresa-desde-plataforma.html`; conservar composición/estilos y no editar el mockup. El diálogo actual es una simulación y debe conectarse, sin ampliar diseño.
- Pruebas esperadas: payload/parseo API, transición en ambos sentidos, confirmación/cancelación, doble clic, 401/403/404/409/red/obsoleta, limpieza de sesión, conservación de listado/filtros/paginación y regresión de provisionamiento inicial.
- Validación de Desarrollo: pruebas focalizadas y `npm run typecheck`; no commits.

## Handoff previo

No existe handoff de FE-040. Las ediciones ya presentes de tabla, diálogo, estilos y layout son diseño de worktree previo; no revertirlas ni adjudicarlas salvo el delta funcional de esta historia.

## Delta de remediación Dev→QA

- Se amplió únicamente `PlatformCompaniesPage.test.tsx` con dobles controlados de sesión y API para cubrir transición bidireccional, cancelación/doble envío, 401/403/404/409/red, respuesta obsoleta, cambio de sesión, conservación de listado y provisionamiento.
- Remediación adicional autorizada: las dos aserciones QA ya son ejecutables; se usa la propiedad nativa `value` y se acota el submit de creación al diálogo. La confirmación se alinea con el mensaje de éxito real, manteniendo la aserción de `provisionInitialAdmin`.

## Estado de remediación

- Corregidos los dos fallos QA bajo autorización adicional. La suite focalizada finaliza con 17 pruebas correctas; queda pendiente revalidación QA. No iniciar Seguridad ni DoF hasta su resultado.
