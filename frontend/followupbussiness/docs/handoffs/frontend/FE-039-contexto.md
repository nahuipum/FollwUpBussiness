# FE-039 — Contexto único de orquestación

## Puerta inicial

Estado: `READY_FOR_HANDOFF` para Desarrollo. Predecesoras y contrato real compatibles: `BE-001` DoF `PASS` (creación publicada), `BE-057` DoF `PASS`, `FE-003` QA/Seguridad `PASS` y `FE-034` DoF `PASS` (`f027a0b + 337464cb`). No hay `CHANGES_REQUIRED` ni `BLOCKED` vigente de FE-034. OpenAPI disponible en `docs/api/openapi.yaml`.

El árbol tiene cambios ajenos y un borrador visual FE-039 sin candidate funcional; preservarlos. Development calcula un único Candidate-ID tras cambios y validación.

## Contrato integrado

- `GET /platform/companies`: solo `PLATFORM_SUPERADMIN`; `page`, `pageSize`, `search` y `status` (`ACTIVE|SUSPENDED`) permitidos; `200 CompanyPage { items, page }`, `401`, `403`.
- `POST /platform/companies`: solo `PLATFORM_SUPERADMIN`; `201 Company`, `401`, `403`, `409`, `422` (también `400`). `CreateCompanyRequest` tiene exclusivamente `legalName`, `code`, `settings` obligatorios; `tradeName`, `taxId` opcionales. `settings` exige `timezone`, `currency`, `geofenceRadiusMeters: 100`, `trackingIntervalSeconds: 60`; no enviar campos extra.
- `POST /platform/companies/{companyId}/initial-admin`: solo `PLATFORM_SUPERADMIN`; `202 User`, `401`, `403`, `404`, `409`, `422` (también `400`). `ProvisionInitialAdminRequest` tiene solo `displayName`, `email` obligatorios y `username` opcional.
- FE-034 centraliza normalización/UI de `401`, `403`, `404`, `409`, `422` y temporal (`500`), incluido `correlationId` vigente. `ApiRequestObsoleteError` descarta respuestas de sesión reemplazada.

## Invariantes y controles

1. Actor plataforma autorizado; UI puede ocultar, Backend autoriza. `403` no permite continuar.
2. Crear empresa antes de provisionar; companyId procede solo de `201` o listado autorizado. Crear refresca lista; `202` actualiza estado/listado.
3. Administrador inicial es fijo `COMPANY_ADMIN`: no selector, rol ni escalación. Nunca `tenantId`, contraseñas, token, secreto o enlace en petición, UI, estado, cache o logs.
4. Formularios, selección, resultados, errores y cache FE-039 se limpian al logout, expiración o cambio de sesión/identidad/tenant; respuestas obsoletas no alteran sesión nueva.
5. Casos: loading, vacío, error temporal, forbidden y datos obsoletos; sin duplicar alertas ni reglas FE-034.

## Superficie visual existente y pruebas

Mockup de referencia Development únicamente: `docs/frontendMockups/FE-039-onboarding-de-empresa-desde-plataforma.html`; no editar. Reutilizar `DashboardLayout`, `PlatformCompaniesPage`, `CompanyTable`, `CreateCompanyModal`, `ProvisionAdminPanel`, `OnboardingSuccess`, `src/lib/api.ts`, auth/sesión y `error-ui`. El borrador actual usa datos locales y estados por query; reemplazar solo lo necesario para contrato, preservando shell.

Pruebas afectadas: `src/features/platform-companies/PlatformCompaniesPage.test.tsx`, `src/lib/api.test.ts`, `src/app/App.test.tsx`, auth/session cercanas. Cubrir listado éxito/vacío/búsqueda/filtro/error, creación/validación/409/422, aprovisionamiento/409, payload exacto, `401` limpia, `403` bloquea, y regresión FE-034/dashboard.

## Fases permitidas

Development: integrar, pruebas focalizadas, typecheck y una CI-equivalente; escribir `FE-039-desarrollo.md` <=300 palabras con `READY_FOR_HANDOFF` o `BLOCKED`. QA recibe solo este paquete, Candidate-ID, handoff Dev, diff/pruebas y emite `FE-039-qa.md`. Security revisa superficie y un abuso decisivo; DoF solo con QA/Security `PASS` y mismo Candidate-ID. Sin Graphify, commit, push o PR.
