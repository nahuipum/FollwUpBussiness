# FE-004 — Paquete de contexto

**Estado de entrada:** `READY_FOR_DEVELOPMENT`  
**Candidate-ID:** pendiente; Desarrollo lo calculará una vez aplicados los cambios.

## Objetivo y límites

Conectar exclusivamente `/company/users` a Backend y reemplazar los mocks funcionales, conservando íntegramente la composición y estilos existentes (no tocar CSS, layout ni rediseñar componentes). Se reutilizan `DashboardLayout`, `VisualSelect`, sesión y manejo global de errores. El mockup visual `docs/frontendMockups/FE-004-users-roles-mockup.html` ya está implementado y no se modifica. No cambiar Backend, OpenAPI, contratos, migraciones ni módulos ajenos.

La pantalla cubre lista, filtros, paginación, invitación, edición y bloqueo/reactivación. Fuera de alcance: vendedores, roles personalizados, usuarios de plataforma y eliminación (no hay endpoint).

## Contrato resumido

- `GET /company/users`: `COMPANY_ADMIN` o `SUPERVISOR`; queries `page`, `pageSize`, `search`, `role` (`COMPANY_ADMIN|SUPERVISOR`) y `status` (`INVITED|ACTIVE|INACTIVE|LOCKED`); devuelve `UserPage { items, page }`.
- `POST /company/users`: solo `COMPANY_ADMIN`; `InviteCompanyUserRequest`: `displayName` (2–160), `email` (email, máx.254), `role` obligatorio (`COMPANY_ADMIN|SUPERVISOR`), `username` opcional (3–100); 202 `User`; 400/403/409/422.
- `PATCH /company/users/{userId}`: solo `COMPANY_ADMIN`; encabezado `If-Match`; `UpdateCompanyUserRequest` igual al anterior; 200 `User`; 403/404/409/422.
- `PATCH /company/users/{userId}/status`: solo `COMPANY_ADMIN`; `{ status: INVITED|ACTIVE|INACTIVE|LOCKED }`; 200 `User`; 403/404/409. Las acciones visuales se limitan a bloquear (`LOCKED`) y reactivar (`ACTIVE`).
- `User`: `id`, `displayName`, `email`, `status`, `role`, `createdAt`, `updatedAt`, `version`; `username`/`phone` opcionales. No exponer ni conservar invitaciones, tokens, credenciales o enlaces.

## Criterios e invariantes

1. Actor autorizado y tenant derivados únicamente de la sesión/servidor; no enviar `tenantId`/`companyId`.
2. UI ofrece solo Administrador (`COMPANY_ADMIN`) y Supervisor (`SUPERVISOR`); nunca `PLATFORM_SUPERADMIN`, `SELLER` ni valores arbitrarios.
3. Rechazo, conflicto, no-op o respuesta obsoleta no muestran éxito ni alteran la tabla; actualizar tras respuesta confirmada.
4. Bloqueo/reactivación requiere confirmación; Backend conserva historial, revoca sesiones y protege el último administrador utilizable.
5. Al logout o cambio de identidad/empresa limpiar lista, filtros, formulario, modales, errores y caché; abortar/ignorar respuestas obsoletas.

Estados requeridos desde respuesta/acción real: carga, vacío, error recuperable, forbidden, filtros/paginación, datos obsoletos y `last updated`. Los mensajes deben ser accesibles. No quedan selectores de vista previa ni `mock-data` como contenido funcional.

## Superficie y verificación

Potenciales: `src/app/App.tsx`, `src/features/company-users/**` y pruebas cercanas; no editar estilos. Transporte existente: `src/lib/api.ts`; identidad/sesión: `src/features/auth/auth.ts` (`subscribeToSession`, generaciones y encabezados de mutación). Diff preexistente ajeno: `App.tsx`, plataforma, dashboard, UI compartida, mockup y artefactos no rastreados; preservar.

| Control | Prueba esperada |
|---|---|
| Listado/filtros/paginación reales | URL, carga, vacío y error HTTP |
| Roles permitidos/payload mínimo | invitación admin/supervisor; no plataforma/vendedor |
| Conflicto y doble envío | 409/422 sin alta local ni éxito |
| Edición/estado | `If-Match`, confirmación y respuesta 200 |
| Sesión/tenant | logout o A→B limpia e invalida petición |

Desarrollo: pruebas focalizadas, typecheck y CI frontend (lint/build). QA: máximo dos comandos; Seguridad reproduce elevación de rol o respuesta obsoleta; DoF solo verifica artefactos, Candidate-ID, gates y `git diff --check`.
