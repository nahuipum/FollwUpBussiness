# Paquete de contexto — BE-057

- Historia: `BE-057 — Provisionar administrador inicial de empresa`
- Alcance de esta sesión: `Desarrollo Backend — remediación de auditoría`
- Estado de Desarrollo: `READY_FOR_HANDOFF`
- Candidate-ID vigente: `HEAD 420a67a + BE-057 diff ea0352867342`
- Seguridad previa: `CHANGES_REQUIRED`; la remediación está implementada y aún no fue revalidada.
- QA: no ejecutado en esta reanudación por instrucción explícita.
- Decisión aprobada: el contrato público de auditoría incorpora la acción
  `PROVISION_INITIAL_COMPANY_ADMIN` y el resultado `CONFLICT`; V21 conserva el
  vocabulario cerrado en PostgreSQL.
- Delta del candidato: el éxito se audita dentro de la transacción; `CONFLICT`
  se registra después del rollback y el rechazo tenant-bound usa la acción y la
  empresa destino inequívocas.

## Dependencias verificadas

- `BE-001 PASS`: empresa persistida; reutilizar `CompanyAccessStatusQuery.isActive(UUID)` sin leer tablas internas de tenancy.
- `BE-006 PASS`: reutilizar acción `ACTIVATION`, token de un solo uso/expirable y cuenta `INVITED`; no crear contraseña predeterminada.
- `BE-007 PASS`: reutilizar `BaseRole.COMPANY_ADMIN`; la asignación queda cerrada en servidor.
- `BE-051 PASS`: reutilizar auditoría crítica saneada y transaccional.
- `EN-010 PASS`: Spring Security deny-by-default, identidad autenticada y secretos fuera de código/logs.
- `EN-011 PASS`: catálogo base y ámbito `COMPANY` de `COMPANY_ADMIN`.
- `EN-012 PASS`: `AuthenticatedActor` con `PLATFORM_SUPERADMIN` y `tenantId == null` identifica plataforma autorizada.

## Contrato afectado

- OpenAPI: `docs/api/openapi.yaml`, `POST /platform/companies/{companyId}/initial-admin` (`operationId: provisionInitialCompanyAdmin`).
- Path: `companyId`; body cerrado `ProvisionInitialAdminRequest` con `displayName`, `email` y `username` opcional.
- El body no admite `role`, `tenantId`, empresa autorizante ni contraseña (`additionalProperties: false`).
- Respuesta contractual: `202` con `User`; errores `400/401/403/404/409/422`.
- Contratos reutilizados: `CompanyAccessStatusQuery`, `AuthenticatedActor`, `BaseRole`, `PasswordRecoveryPort`/activación y `RecordAuditEntryUseCase` o fachada auditada equivalente.

## Criterios normalizados

1. Autorizar solo identidad autenticada `PLATFORM_SUPERADMIN` no vinculada a tenant; cualquier otra identidad obtiene rechazo sin mutación.
2. Exigir que `companyId` exista y esté `ACTIVE`; inexistente o suspendida se rechaza sin crear cuenta ni activación.
3. Crear la cuenta en la empresa destino con rol servidor `COMPANY_ADMIN`; ignorar no basta: propiedades extra para rol, tenant o empresa deben rechazarse.
4. Normalizar y asegurar unicidad de correo/nombre de usuario dentro de la empresa, también bajo concurrencia; no imponer unicidad global.
5. Persistir la cuenta sin contraseña utilizable, estado apto para BE-006 y emitir/reutilizar activación de un solo uso expirable sin revelar token.
6. Auditar operación y resultado sin contraseña, token ni correo/nombre completos; observabilidad solo operación, resultado, latencia, tipo de error y correlationId.

## Invariantes

1. Solo una identidad de plataforma autorizada puede provisionar.
2. La empresa destino debe existir y estar activa.
3. El rol es `COMPANY_ADMIN` fijado por servidor; el cliente no elige rol, tenant ni empresa autorizante.
4. Correo/nombre de usuario es único dentro de la empresa, incluida concurrencia; no existe requisito de unicidad global.
5. La cuenta queda sin contraseña utilizable y reutiliza activación BE-006.
6. Auditoría y observabilidad no contienen contraseña, token ni datos personales completos.

## Verificación dirigida de Desarrollo (máximo cinco grupos)

1. Plataforma autorizada frente a usuario sin permiso o identidad tenant-bound.
2. Empresa activa frente a inexistente, suspendida o distinta de la autorizada.
3. Inyección de rol de plataforma/arbitrario, tenant o empresa.
4. Duplicado y carrera concurrente de correo/nombre dentro de empresa, permitiendo el mismo identificador en otra empresa.
5. Creación, rol fijo, activación BE-006 y auditoría saneada, incluido fallo transaccional relevante.

`HexagonalArchitectureTest` o `ModuleBoundaryTest` solo si el diff cambia dependencias o límites. Desarrollo debe dejar un handoff máximo de una página en `docs/handoffs/backend/BE-057-development-handoff.md`, reemplazar `PENDING` por un único identificador (`HEAD + digest corto del diff`) y terminar en `READY_FOR_HANDOFF` o bloqueo real.
