# Handoff QA Backend — BE-007 — revalidación de seguridad

## Estado

`PASS`

## Candidato verificado

- Base/HEAD: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- Diff funcional Backend: las 13 rutas declaradas por el paquete v4 (sin
  gobernanza ni handoffs), con fingerprint canónico fijado
  `261c12f5907fd534b6531095746d3108ec9c7f6caaefd688af9549d10b965c69`.
- `git rev-parse HEAD` devolvió la base fijada; el worktree contiene las 13
  rutas Backend candidatas y los artefactos de handoff excluidos. `git diff
  --check` sobre el diff rastreado desde la base: PASS. No se modificó el
  candidato durante la revisión.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| AC-01 | `ResourceAccessAuthorizer` aplica decisión por rol, tenant y objeto antes de permitir; niega por defecto. | `ResourceAccessAuthorizerTest` (propio, tenant ajeno, equipo inexistente y grant explícito). | PASS |
| AC-02 | Supervisor requiere `TeamMembershipQuery.isSupervisorOf(...)` con `tenantId` del recurso. El grant no se usa para ampliar el alcance. | `supervisorRequiresCurrentPersistedTeamMembershipAndTenantMatch`; `explicitGrantCannotBroadenSellerOwnershipOrSupervisorTeamScope`. | PASS |
| AC-03 | Vendedor sólo se autoriza si es propietario y el tenant del actor coincide con el recurso; el grant no amplía acceso. | `sellerCanOnlyAccessTheirOwnResourceInTheirTenant`; negativa de grant explícito. | PASS |
| AC-04 | `canAccess` exige `correlationId` recibido por la operación y lo reenvía al puerto de auditoría junto con UUID técnicos y resultado. | `accessDecisionAuditsTheOperationCorrelationIdWithoutCredentialsOrPersonalData`; negativa de correlationId nulo. | PASS |
| AC-05 | `InboundJwtAuthenticator` deriva actor/tenant de sesión persistida; para tenant no nulo exige empresa durable `ACTIVE`, y principal plataforma sólo acepta tenant persistido nulo. | `InboundJwtAuthenticatorTest`: suspendida, inexistente, sesión no resoluble, tenant persistido y plataforma nula. | PASS |

## Comandos y evidencia

- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" "-Dtest=InboundJwtAuthenticatorTest,ResourceAccessAuthorizerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS; 14 pruebas, 0 fallos/errores.
- `git diff --check f320938d55f8ca9bf58d0df0bab259749ca5974e HEAD`: PASS.
- Inspección independiente de los 13 archivos candidatos y sus dos clases de prueba: confirma que `ResourceAccessGrantQuery` no participa en los caminos de `SELLER` ni `SUPERVISOR`; la auditoría recibe el `correlationId` de la invocación, no genera uno; y la consulta de autenticación filtra empresa ausente o no `ACTIVE` para todo actor company-scoped.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" "-Dtest=BaseRoleCatalogMigrationTest" test`: NOT_EXECUTED para migración V7. Testcontainers no pudo abrir el daemon Docker (`\\.\\pipe\\docker_engine`, acceso denegado), antes de ejecutar Flyway. No es un fallo del candidato.
- No se reutilizó CI del mismo commit: el candidato es un diff no indexado sobre la base fijada y no se proporcionó ejecución CI verificable para ese fingerprint.

## Hallazgos

Ninguno.

## Regresión relevante y riesgos residuales

- La selección de arquitectura (4 pruebas) y de autenticación/autorización (10 pruebas) pasa; no se observó regresión de límites hexagonales ni de módulos.
- Riesgo residual: la ejecución PostgreSQL/Flyway de V7 y las negativas de empresa suspendida/inexistente permanecen sin evidencia de integración porque Docker no está disponible. La evidencia unitaria sí cubre el fail-closed del autenticador y los límites de tenant/equipo/propiedad.
- Idempotencia: NOT_APPLICABLE; el diff no incorpora un comando reintentable ni una operación de escritura expuesta.

## Excepciones

Ninguna. Se utilizaron exclusivamente el paquete v4, el handoff de remediación y el código/pruebas/migración del candidato.
