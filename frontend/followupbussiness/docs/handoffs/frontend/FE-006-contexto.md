# FE-006 — Paquete único de contexto

Estado actual: `DOF_PASS`. Candidate-ID: `HEAD 35836fd + FE-006 formulario/api/sesión/pruebas; delta: recarga accesible 409`.

## Puerta y referencias

Predecesoras verificadas: `BE-008`, `BE-009`, `BE-011`, `BE-012`, `BE-062` y `FE-005` tienen DoF `PASS`. Sus contratos OpenAPI están estables. No existe `docs/frontendMockups/FE-006.html`; la referencia visual exclusiva es `src/features/company-users/`, en particular sus diálogos de Administradores y Supervisores. No modificar mockups.

## Alcance Development

Restaurar en `src/features/company-sellers/` el formulario React/TypeScript para crear y editar. Separar diálogo/formulario, cliente API, hook/estado, tipos y pruebas cuando tengan responsabilidad propia. Integrarlo con FE-005 para abrir crear/editar, actualizar listado y feedback. No tocar estado, rutas, cartera, activación/inactivación ni acceso. Aplicar el patrón visual, foco inicial/trap/retorno, etiquetas, alertas, teclado, doble envío, overlays y responsive de `company-users`, sin copiarlo sin adaptación.

Solo `COMPANY_ADMIN` muestra y opera los controles; `SUPERVISOR` conserva el listado sin gestión y `SELLER` no accede al formulario. El servidor sigue siendo autoridad. Al logout o cambio de empresa, cerrar/restablecer diálogo, solicitudes y opciones cargadas; nunca conservar datos del tenant previo. No registrar payloads, PII completa, IDs sensibles, credenciales, tokens ni enlaces.

## Contrato

`POST /sellers` (solo admin): `displayName` (2–160) y `email` (email, máx. 254) requeridos; opcionales `username` (3–100), `phone` (máx. 30), `employeeCode` (máx. 50), `supervisorId`, `territoryIds` únicos. Respuesta 202; invitación/activación es Backend: no pedir ni mostrar secretos.

`PATCH /sellers/{sellerId}` (solo admin) usa `If-Match` con la `version` actual y solo transmite `displayName`, `phone`, `employeeCode` (al menos uno). `PUT /sellers/{sellerId}/supervisor` admite `{ supervisorId: uuid | null }`; `PUT /sellers/{sellerId}/territories` recibe `{ territoryIds: uuid[] }` únicos. Edición puede efectuar las tres operaciones: éxito global únicamente si todas las solicitadas finalizan; ante fallo parcial indicar sección, conservar corrección/reintento y refrescar desde Backend. Ante 409, conservar lo escrito y ofrecer recargar.

Opciones reales y paginadas/eficientes: `GET /company/users?role=SUPERVISOR&status=ACTIVE` (mostrar `displayName`) y `GET /territories?status=ACTIVE` (mostrar `code`/`name`). Sin mocks ni una llamada por opción. Manejar 403, 409, 422, red, carga, vacío y datos stale sin éxito falso.

## Invariantes y validación

Actor/recurso: admin y recursos del tenant actual; denegación: supervisor/seller y 403; conflicto: 409/version sin sobrescritura; fallo: sin éxito global, sin estado falso y refresco. Puertos alcanzables: POST/PATCH/PUT de vendedor, GET usuarios y GET territorios; ciclo de sesión. Verificar pruebas focalizadas y `npm run typecheck`; por cliente API/composición/sesión, ejecutar también lint y build. Artefactos únicos: Development `docs/handoffs/frontend/FE-006-development-handoff.md`, QA `docs/handoffs/qa/FE-006-qa-handoff.md`, Seguridad `docs/handoffs/security/FE-006-security-review.md`, DoF `docs/handoffs/governance/FE-006-dof.md`.

## Delta Development

Se abrió `docs/api/openapi.yaml` (fragmentos `/company/users`, `/territories`, `/sellers` y esquemas asociados) por ambigüedad nueva sobre el sobre paginado y los campos de las opciones reales; confirmó `items/page`, `displayName` y `code/name`.
