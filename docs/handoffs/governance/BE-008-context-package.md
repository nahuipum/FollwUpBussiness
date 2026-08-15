# Paquete de contexto — BE-008 Crear vendedor

Estado actual: `PASS`  
Candidate-ID: `HEAD c38dad7 + BE-008 rollback-audit-integration/pruebas`.

## Delta DoF

DoF `PASS`: Development `READY_FOR_HANDOFF`, QA `PASS` y Seguridad `PASS` trazables al mismo Candidate-ID. Evidencia CI declarada: pruebas focalizadas y `mvn -q clean verify` PASS; comprobación final `git diff --check` PASS. Sin puertas ni hallazgos pendientes.

## Delta de Seguridad

Seguridad final `PASS` para el mismo Candidate-ID; abuso `SUPERVISOR` reproducido PASS, aislamiento tenant/secretos/PII sin hallazgos. Prueba HTTP negativa `NOT_EXECUTED`: riesgo residual bajo.

## Delta de remediación

Se añadió `SellerCreationTransactionIntegrationTest`: PostgreSQL/Flyway y el proxy `@Transactional` real fuerzan `audit.record=false` después de crear la invitación. La prueba verifica cero `identity_access_account` SELLER, `workforce_seller`, `workforce_seller_territory`, `identity_access_action_token` e `identity_access_notification` tras el rollback. No cambia producción, contrato ni migración.

## Delta de Desarrollo

Se añadió el vertical Workforce de creación: migración V27, perfil y relaciones de vendedor, `POST /sellers`, validación de supervisor/territorio activos del tenant y orquestación transaccional con la invitación de activación existente. La identidad `SELLER` solo se crea por la vía interna de BE-008; `/company/users` conserva sus roles permitidos. Auditoría y outbox de identidad quedan dentro de la misma transacción. `SellerServiceTest` y `ModuleBoundaryTest` PASS; `mvn -q clean verify` PASS.

## Predecesoras y contrato estable

- BE-058: DoF `PASS` en `docs/handoffs/governance/BE-058-dof.md`; Candidate-ID `HEAD d6c3460… + test-isolation`.
- BE-062: DoF `PASS` en `docs/handoffs/dof/BE-062-dof.md`; Candidate-ID `HEAD 14b5223… + workforce/audit/V26`.
- Ambos handoffs de Seguridad son `PASS`. Las predecesoras están finalizadas y sus contratos `/company/users` y `/territories` son estables para esta historia.

## Alcance y contrato

Implementar exclusivamente `POST /sellers` para crear perfil de vendedor y usuario de acceso separados, para el tenant de la sesión. Contrato: `CreateSellerRequest` (obligatorios `displayName`, `email`; opcionales `username`, `phone`, `employeeCode`, `supervisorId`, `territoryIds`), respuesta `202 Seller`; errores `400`, `403`, `409`, `422`. El endpoint es solo `COMPANY_ADMIN`. No modificar OpenAPI ni inventar campos/reglas.

El usuario queda invitado; reutilizar el flujo BE-006 de activación de un solo uso. Nunca aceptar, crear, transmitir, registrar o devolver contraseña, token, enlace u otro secreto. `Seller` no debe revelar secretos.

## Invariantes y controles

1. Actor/recurso: actor y `tenantId` solo desde la sesión; `COMPANY_ADMIN` solo puede crear en su tenant. `SUPERVISOR`, `SELLER`, no autenticado y roles ajenos: denegación contractual, sin revelar existencia.
2. Éxito: validar obligatorios; identidad y perfil se persisten separados; correo y/o username son únicos según alcance tenant del contrato. Supervisor y territorios deben estar activos y ser del tenant; crear invitación unitaria, auditoría mínima y observabilidad con `correlationId` sin PII completa.
3. Denegación: 400/403/409/422 conforme contrato, cero perfil/usuario/relaciones/invitación/auditoría y ninguna credencial utilizable.
4. Conflicto/reintento: duplicado y concurrencia no crean vendedor, usuario ni invitación adicionales.
5. Fallo/rollback: si falla usuario, perfil, relación, auditoría o invitación/outbox, no queda identidad parcial utilizable; usar transacción/compensación existente.

Puertos alcanzables: persistencia identidad y perfil vendedor; lectura de supervisor/territorio; invitación/activación BE-006 y notificación durable; auditoría, outbox/observabilidad. Política de datos: omitir secretos; auditoría/eventos/logs solo IDs y categorías aprobadas, no PII completa.

## Superficies y evidencia esperada

- Historia: `docs/stories/backend/BE-008-crear-vendedor.md`.
- Contrato: `docs/api/openapi.yaml` (`/sellers`, `/territories`, `CreateSellerRequest`, `Seller`, activación BE-006).
- Inspeccionar primero diff, módulo Workforce/IdentityAccess y pruebas próximas. Mantener hexagonalidad y tenantId.
- Desarrollo: pruebas focalizadas y `mvn -q clean verify` PASS; Handoff Dev en `docs/handoffs/backend/BE-008-development-handoff.md`.
- QA posterior debe probar éxito, roles denegados, recursos inactivos/inexistentes/cross-tenant, duplicado, fallos atómicos, ausencia de secretos, auditoría/correlación solo en éxito y concurrencia.
- Seguridad aplicable: abuso decisivo cross-tenant o creación como supervisor; confirmar ausencia de secretos/PII completa.

No commits, push ni PR. Cambios y artefactos solo BE-008.
