# Handoff Desarrollo — BE-007

## Estado

`READY_FOR_HANDOFF`

## Candidato revisable

- Base fijada: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- HEAD: `f320938d55f8ca9bf58d0df0bab259749ca5974e` (worktree sin commits, diff funcional no indexado).
- Se excluye `docs/handoffs/governance/BE-007-context-package.md` del diff funcional inicial.
- `git diff --check f320938d55f8ca9bf58d0df0bab259749ca5974e`: PASS.

## Alcance implementado

- `identityaccess` resuelve en cada Bearer válido cuenta, rol y tenant desde la familia de sesión y la cuenta persistidas; el principal es `AuthenticatedActor`, sin confiar en el tenant del cliente/JWT.
- `ResourceAccessAuthorizer` aplica autorización por objeto: platform admin, admin de la empresa, supervisor únicamente sobre integrantes de su equipo vigente, vendedor únicamente sobre su recurso; los grants explícitos no evaden tenant.
- La migración V7 agrega equipos y membresías tenant-scoped, grants por recurso y auditoría técnica de decisiones (`correlationId`, UUID técnicos, resultado), sin credenciales, tokens, payloads ni PII completa.

## Archivos funcionales

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/AuthenticatedActor.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/ResourceAccessAuthorizer.java`
- Puertos/adaptadores JDBC bajo `identityaccess/application/port/out` y `identityaccess/adapter/out/persistence` para equipos, grants y auditoría.
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticator.java`
- `backend/followupbussiness/src/main/resources/db/migration/V7__create_identity_access_teams_and_resource_grants.sql`
- Pruebas: `InboundJwtAuthenticatorTest` y `ResourceAccessAuthorizerTest`.

## Contratos y migraciones

- No se modificó OpenAPI: no se agregó una mutación `/company/users*`, reservada para BE-058.
- Migración forward-only V7; Flyway limpio validado en PostgreSQL 17 por Testcontainers.
- La consulta `/me` ya declarada requiere una proyección pública completa de `tenancy` para el objeto `Company`; no se accedió a tablas internas ni se alteró silenciosamente el contrato. Es una dependencia de integración a revisar por QA con BE-003.

## Matriz criterio → evidencia

| Criterio | Evidencia |
|---|---|
| AC-01 | `InboundJwtAuthenticatorTest`: firma, sesión y rol persistido obligatorios; seguridad global existente conserva 401/403. |
| AC-02 | `ResourceAccessAuthorizerTest.supervisorRequiresCurrentPersistedTeamMembershipAndTenantMatch`; consulta JDBC filtra tenant. |
| AC-03 | `ResourceAccessAuthorizerTest.sellerCanOnlyAccessTheirOwnResourceInTheirTenant`. |
| AC-04 | V7 `identity_access_access_decision_audit`; adaptador persiste solo IDs técnicos, correlationId, tipo/id de recurso y resultado. |
| AC-05 | Principal deriva tenant/rol de BD; no se amplió OpenAPI ni se usaron claims como autorización por objeto. |

## Comandos y resultado

- `mvn -Dmaven.repo.local=C:\tmp\followup-m2 -Dtest=BaseRoleTest,LoginServiceTest,InboundJwtAuthenticatorTest,ResourceAccessAuthorizerTest,PlatformSuperadminBootstrapMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest test`: PASS, 24 pruebas.
- `git diff --check f320938d55f8ca9bf58d0df0bab259749ca5974e`: PASS.
- `python -m graphify update .`: PASS; grafo actualizado.

## Seguridad y riesgos residuales

- Se cubren cruce de tenant, vendedor sobre recurso ajeno, supervisor fuera de equipo, grant explícito cross-tenant y token que no coincide con estado durable.
- La política es un caso de uso reutilizable: cada futuro adaptador de recurso debe invocarla con propietario y tenant durables; el rol del endpoint por sí solo no es suficiente.
- No hay endpoint de administración de roles/equipos/grants en este incremento para no invadir BE-058. La auditoría de sus mutaciones deberá ser usada por ese caso de uso cuando se incorpore.
- Sin cambios de arquitectura ni ADR requerido.

## Reproducción

1. Ejecutar el comando Maven anterior desde `backend/followupbussiness` con Docker disponible.
2. Revisar V7 y las pruebas de `identityaccess`; la migración limpia comprueba las restricciones tenant y el test unitario prueba las negativas de autorización.

## Fuentes releídas por excepción

- Motivo: confirmar la forma exacta del contrato afectado `/me` antes de decidir no introducir una respuesta incompatible sin proyección pública de `tenancy`.
- Ruta/sección: `docs/api/openapi.yaml`, `/me` (`getCurrentUser`) y `CurrentUser`/`UserSummary`.
- SHA-256: `8957594b552d75588dcf24ca1adac906aeba7b7ee1a18b7722436875050792d9` (coincide con paquete v1).
- Resultado: `/me` exige `CurrentUser.company` como `Company` completo o null; no se creó acceso directo a tablas de `tenancy` ni se cambió contrato.
