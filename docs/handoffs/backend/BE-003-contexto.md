# BE-003 — paquete de contexto

**Estado:** Desarrollo listo para handoff tras evidencia Security. **Candidate-ID:** `HEAD 71a31cc + backend-diff f8ae5b88eca5d085f7209b640bd07ab61ba52cb8`.

## Alcance confirmado

- Corregir el `GET /me` existente; no crear endpoint ni cambiar OpenAPI. Su `200` es `CurrentUser`.
- `CurrentUser` compone `UserSummary` y `company: Company | null`. `Company` contractual completo exige `id`, `legalName`, `code`, `status`, `settings`, `createdAt`, `updatedAt`, `version` (con opcionales `tradeName`, `taxId`). Login WEB/MOBILE y refresh ya declaran `user: CurrentUser`.
- Implementación actual: `LoginController` y `RefreshController` construyen por separado `user` y ponen `company` como UUID; `/me` no está implementado. Reutilizar una proyección común, sin entidades de persistencia ni duplicar reglas.

## Invariantes y controles

1. `PLATFORM_SUPERADMIN`: `company: null`; sin tenant.
2. `COMPANY_ADMIN`, `SUPERVISOR`, `SELLER`: únicamente empresa autenticada, con modelo `Company` contractual.
3. Tenant solo procede de sesión/autenticación, nunca de parámetro, body o header del cliente.
4. `/me`, login y refresh comparten proyección `CurrentUser`.
5. Cuenta bloqueada/inactiva o empresa suspendida/inactiva se rechaza; revocación es inmediata y PostgreSQL decide sesión activa.
6. Rol tenant sin empresa falla de forma segura; sin datos cruzados ni identidad incompleta válida.
7. No exponer passwords/hashes, refresh/CSRF, enlaces/tokens, secretos, auditoría ni datos fuera del contrato/canal.

## Arquitectura y puntos conocidos

- Dominio `identityaccess`: adapter REST → puerto de entrada/caso de uso → puertos de salida. El modelo HTTP no llega al dominio; PostgreSQL sigue fuente de verdad.
- Login usa `LoginService.Result`/`LoginAccountQuery.Account`; refresh usa `RefreshService.Result`; ambos validan cuenta activa y estado de compañía. `RefreshService` ya consulta `CompanyAccessStatusQuery`.
- Código/pruebas cercanos: `identityaccess/adapter/in/rest/{LoginController,RefreshController}.java`, `application/{LoginService,RefreshService}.java`, `config/LoginConfiguration.java`, y pruebas `LoginControllerTest`, `RefreshControllerTest`, `RefreshServiceTest`, `InboundJwtAuthenticationFilterTest`, `AuthenticationContractPolicyTest`.
- ADR-008: login/refresh no aceptan tenant del cliente; bloqueo/inactivación/suspensión/revocación invalidan familias inmediatamente. Mantener códigos/respuestas contractuales existentes.

## Verificación requerida

- `/me`: cada rol tenant (admin/supervisor/seller), plataforma nula, anónimo/revocado/bloqueado/suspendido y aislamiento.
- Login y refresh: misma forma exacta `CurrentUser`; no UUID en `company`; regresión login/refresh/logout y ausencia de secretos.
- Ejecutar focalizadas y `mvn -q clean verify` desde `backend/followupbussiness` antes del handoff.

## Estado inicial

Worktree tiene cambios ajenos únicamente en Frontend y artefactos FE-004; preservarlos. `git diff --check` inicial sin hallazgos. No hay contradicción OpenAPI: no modificarlo.

## Delta de remediación

- `InitialCompanyAdminUniquenessIntegrationTest` invoca la firma vigente de `LoginConfiguration.provisionInitialCompanyAdminUseCase`, incluido `emailEnabled=true`; no cambia producción ni semántica BE-003.
- `SecurityErrorDispatchIntegrationTest` vuelve a usar `/platform/not-mapped`: `/platform/companies` ya es una ruta protegida de FE-039 y por ello el 403 era correcto. Se preservan 404 autenticado tras `ERROR` dispatch y 401 anónimo, sin modificar producción.
- PASS: prueba focalizada y `mvn -q clean verify`.

## Delta de remediación QA

- `CurrentUserProjection.Unauthenticated` se traduce antes de emitir respuesta: login devuelve `401 AUTHENTICATION_FAILED` y refresh `401 REFRESH_TOKEN_INVALID`, sin cookies ni credenciales expuestas.
- `/me` cubre por HTTP anónimo, revocado, bloqueado y empresa suspendida (401); `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER` reciben solo su empresa ACTIVE vinculada.
- PASS: prueba focalizada y `mvn -q clean verify`; sin contrato ni migración nuevos.

## Delta de evidencia Security

- `CurrentUserControllerTest` prueba por HTTP un `AuthenticatedActor` SELLER cuyo `tenantId` difiere de la empresa persistida de la cuenta: `/me` responde `401 AUTHENTICATION_FAILED` y el puerto `CurrentCompanyQuery` no recibe ninguna consulta; no hay exposición de empresa ajena.
- PASS: `mvn -q '-Dtest=CurrentUserControllerTest' test`. Sin cambios de producción, contrato ni migración.
