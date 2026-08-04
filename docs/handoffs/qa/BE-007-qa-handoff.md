# Handoff QA Backend — BE-007

## Estado

`CHANGES_REQUIRED`

## Candidato y fingerprint verificado

- Base/HEAD: `f320938d55f8ca9bf58d0df0bab259749ca5974e` (coinciden).
- Fingerprint funcional fijado por el paquete: SHA-256 `c8ffbe5a5baebfaabfc4099b3be90a43fe884f9bb73694536994784834cf9181`.
- Se verificó que el worktree funcional Backend contiene exactamente los 13 archivos BE-007 declarados (3 modificados y 10 nuevos), sin cambios de contrato; se excluyeron gobernanza y handoffs. `git diff --check` y la comprobación equivalente de los archivos nuevos no reportaron errores de whitespace.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| AC-01 | `ResourceAccessAuthorizer.canAccess` usa rol, tenant, propietario, equipo y grant. | Inspección y `ResourceAccessAuthorizerTest` (3 PASS). El grant habilita acceso contrario a las restricciones de rol. | FAIL |
| AC-02 | `JdbcTeamMembershipQuery` filtra por `tenant_id`; política consulta equipo vigente. | La negativa sin equipo y cross-tenant pasa, pero un grant del mismo tenant permite al supervisor salir de su equipo. | FAIL |
| AC-03 | Política compara vendedor con `ownerAccountId` y tenant. | `sellerCanOnlyAccessTheirOwnResourceInTheirTenant` cubre propietario/no propietario/cross-tenant; `explicitGrantNeverBypassesTenantIsolation` prueba y acepta el bypass del vendedor no propietario. | FAIL |
| AC-04 | V7 y `JdbcAccessDecisionAuditAdapter` persisten IDs técnicos, tipo/id y resultado. | Inspección: no expone secreto/PII completo. `canAccess` genera `UUID.randomUUID()` en vez de propagar el correlationId de solicitud; no existe prueba del adaptador/auditoría. Migración con PostgreSQL: NOT_EXECUTED localmente (Docker no disponible). | FAIL |
| AC-05 | `InboundJwtAuthenticator` resuelve tenant/rol desde sesión y cuenta persistidas; no se modifica OpenAPI. | `InboundJwtAuthenticatorTest` (2 PASS), diff y límites arquitectónicos. | PASS |

## Comandos y evidencia

- `graphify query "BE-007 identityaccess authorization teams resource grants audit tenant"`: trazó política, migración, autenticador y pruebas afectadas.
- `git diff --check f320938d55f8ca9bf58d0df0bab259749ca5974e -- backend/followupbussiness`: PASS; verificación `--no-index` de los 10 nuevos: PASS.
- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=BaseRoleTest,LoginServiceTest,InboundJwtAuthenticatorTest,ResourceAccessAuthorizerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 16 pruebas.
- Batería declarada por Desarrollo, incluyendo `PlatformSuperadminBootstrapMigrationTest`: 16 pruebas no-PostgreSQL PASS; migración NOT_EXECUTED porque Testcontainers no pudo acceder a `\\.\pipe\docker_engine`. No se clasifica como fallo funcional.

## Hallazgos

1. **CRITICAL — Grant explícito elude las restricciones obligatorias de supervisor y vendedor.**
   - Evidencia: `ResourceAccessAuthorizer.java`, método `canAccess`, evalúa `grants.hasAccess(...)` antes de las condiciones de `SELLER` (propietario) y `SUPERVISOR` (equipo). Esto permite un grant del mismo tenant para un recurso ajeno.
   - Reproducción: ejecutar `ResourceAccessAuthorizerTest.explicitGrantNeverBypassesTenantIsolation`; construye un `SELLER` no propietario del tenant del recurso y un query de grant que devuelve `true`; la prueba actualmente espera `true`. El mismo flujo con rol `SUPERVISOR`, sin membresía de equipo y grant `true`, también devuelve `true`.
   - Impacto: viola AC-02 y AC-03; permite acceso horizontal dentro del tenant a un vendedor/supervisor fuera de su ámbito.

2. **HIGH — La auditoría no conserva el correlationId de la solicitud.**
   - Evidencia: `ResourceAccessAuthorizer.canAccess` invoca `audit.record(UUID.randomUUID(), ...)`; no recibe ni obtiene el ID de correlación de la operación. El adaptador persiste ese UUID aleatorio en `correlation_id`.
   - Reproducción: dos decisiones de una misma solicitud no pueden asociarse con su correlationId de entrada porque el método no tiene ese dato y genera uno nuevo para cada decisión.
   - Impacto: incumple trazabilidad exigida por AC-04/R-05, aunque los campos persistidos no contienen secreto ni PII completa.

## Regresión relevante y riesgos residuales

- Arquitectura: `HexagonalArchitectureTest` (3) y `ModuleBoundaryTest` (1) PASS; no se detectó dependencia del dominio hacia Spring/JDBC ni acceso directo a otro dominio. ADR adicional: no requerido por este diff.
- Autenticación persistida, rol/tenant derivados del servidor y negativas cross-tenant unitarias: cubiertos por las pruebas dirigidas.
- La migración V7 no tuvo validación independiente con PostgreSQL por indisponibilidad local de Docker; reutilizar evidencia CI verificable del mismo candidato o reejecutarla con Docker antes del siguiente gate.
- No aplica idempotencia: el diff no introduce un comando/mutación pública reintentable.

## Lecturas excepcionales

Ninguna. Se usaron exclusivamente el paquete v2, el handoff de Desarrollo, el candidato y sus código/pruebas afectados.
