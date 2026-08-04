# Handoff QA Backend — Revalidación BE-007

## Estado

`PASS`

## Candidato verificado

- Base/HEAD: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- Fingerprint funcional fijado por el paquete v3: `d5697f492c8ef7488cc4d6d4986b6632c5cd4dec2bee2777b82e23d3b5e62057`.
- Alcance actual: 13 archivos funcionales bajo `backend/followupbussiness` (3 modificados y 10 nuevos), sin artefactos de gobernanza/handoffs; `git diff --check` PASS.
- El árbol de trabajo contiene el candidato no indexado; no se alteró código, configuración, pruebas ni documentación funcional durante QA.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| AC-01 | `ResourceAccessAuthorizer` aplica decisión por rol y recurso; JWT resuelve actor persistido. | `ResourceAccessAuthorizerTest` (negativas por dueño/equipo/tenant) e `InboundJwtAuthenticatorTest` (sesión no resoluble rechazada). | PASS |
| AC-02 | `SUPERVISOR` exige igualdad de tenant y `TeamMembershipQuery` para el dueño del recurso. El grant no se consulta en la decisión. | `supervisorRequiresCurrentPersistedTeamMembershipAndTenantMatch`; `explicitGrantCannotBroadenSellerOwnershipOrSupervisorTeamScope`. | PASS |
| AC-03 | `SELLER` exige igualdad de tenant y `accountId == ownerAccountId`; el grant no es alternativa. | `sellerCanOnlyAccessTheirOwnResourceInTheirTenant`; negativa explícita con grant. | PASS |
| AC-04 | `canAccess` exige `correlationId` y lo entrega sin transformación a `AccessDecisionAuditPort`; adaptador persiste solo IDs técnicos, tipo y resultado. | `accessDecisionAuditsTheOperationCorrelationIdWithoutCredentialsOrPersonalData` y `accessDecisionRequiresTheOperationCorrelationId`. | PASS |
| AC-05 | `InboundJwtAuthenticator` deriva `tenantId` de sesión/cuenta persistida, valida rol cerrado y crea `AuthenticatedActor`; no hubo cambio OpenAPI. | `acceptsSignedCompanyTokenOnlyWhenItsTenantComesFromThePersistedSession`; revisión de diff y de invocaciones. | PASS |

## Comandos y evidencia

- `git rev-parse HEAD`, `git status --short`, `git diff --check`, `git diff --name-only`, `git ls-files --others --exclude-standard backend/followupbussiness`: HEAD coincide con la base fijada, 13 archivos funcionales Backend y comprobación de espacios PASS.
- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=ResourceAccessAuthorizerTest,InboundJwtAuthenticatorTest" test`: PASS, 7 pruebas; incluye negativas tenant/propietario/equipo, bypass por grant, `correlationId` real y JWT de sesión inválida.
- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 4 pruebas.
- `rg -n "\.hasAccess\\(" ...`: sin invocaciones de `ResourceAccessGrantQuery.hasAccess`; la dependencia persiste como capacidad de construcción, pero no puede ampliar la política actual de vendedor/supervisor.
- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=BaseRoleCatalogMigrationTest" test`: NOT_EXECUTED para la migración: Testcontainers no pudo conectarse a `\\.\pipe\docker_engine` (Docker local no disponible), antes de ejecutar aserciones. No es un defecto del candidato.

## Defectos

Ninguno.

## Regresión relevante

- Las pruebas dirigidas de autorización/autenticación y las dos pruebas arquitectónicas pasan.
- La política conserva aislamiento por tenant y no introduce dependencia de `application` hacia adaptadores/configuración; no se requiere ADR adicional para esta remediación.
- La migración V7 es forward-only y contiene PK/FK, unicidad e índices para equipo/grant/auditoría; su ejecución real queda pendiente de un entorno Docker/CI disponible.

## Riesgo residual

- `BaseRoleCatalogMigrationTest` no se pudo ejecutar por indisponibilidad del daemon Docker local. Ejecutar esa prueba o la CI equivalente con PostgreSQL/Testcontainers antes del gate final para comprobar aplicación/compatibilidad de V7.
- `ResourceAccessGrantQuery` continúa cableado pero sin uso en la decisión. Cualquier uso futuro debe mantener los límites obligatorios de tenant, propietario del vendedor y equipo vigente del supervisor.

## Lecturas excepcionales

Ninguna. Se utilizaron exclusivamente el paquete v3, el handoff de remediación, el candidato fijado y el código/pruebas del diff para la verificación.
