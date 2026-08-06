# BE-002 — Handoff Desarrollo Backend

- Estado: `READY_FOR_HANDOFF`
- Candidate-ID: `BE002-CAND-4308ce97d4f8-97fa9577e04d`
- Paquete: `docs/handoffs/governance/BE-002-context-package.md`
- Remediación: `SEC-BE002-001` exclusivamente.

## Alcance y sinks protegidos

- `ChangeCompanyStatusService` conserva `reason` como entrada validada, pero para una transición real entrega únicamente el valor fijo `REASON_PROVIDED` al comando de auditoría.
- El único sink durable BE-002, `audit_entry.reason` mediante `RecordPlatformCompanyAudit` y `JdbcAuditEntryStore`, recibe ese código fijo; no se registra ni se publica el texto libre en otro sink de la capacidad.
- La auditoría conserva actor confiable, empresa, acción, resultado, correlación y antes/después permitidos. El no-op sigue sin escritura ni auditoría de cambio.

## Contratos y migraciones

- Sin cambio de contrato/API: `reason` permanece en el body y en el comando.
- Sin migración nueva; la migración existente `V22__add_sanitized_audit_reason.sql` conserva la columna para el código seguro.

## Pruebas y verificación

- `mvn -q '-Dtest=ChangeCompanyStatusServiceTest,CompanyStatusTransactionTest' test`: ejecución inicial bloqueada por repositorio Maven del sandbox; al reintentarse detectó un fallo de fixture de actor, corregido antes de la regresión final.
- `mvn -q '-Dtest=ChangeCompanyStatusServiceTest,CompanyStatusTransactionTest,CompanyControllerTest,RefreshServiceTest,RefreshControllerTest,RefreshRateLimiterTest' test`: `PASS`.
- Las pruebas verifican que motivo común, email, token, bearer, secreto y texto arbitrario se reemplazan por `REASON_PROVIDED`; la persistencia conserva actor, empresa, acción y resultado, y el no-op no crea auditoría.
- `git diff --check`: `PASS`.

## Riesgo y reproducción

- Riesgo residual: el texto libre permanece transitoriamente en memoria durante la petición para validación, pero no alcanza persistencia, auditoría ni logging de BE-002.
- Reproducir desde `backend/followupbussiness` con el segundo comando Maven indicado.
