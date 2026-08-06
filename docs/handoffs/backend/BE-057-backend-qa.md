# BE-057 — QA Backend (remediación de auditoría)

- Estado: `CHANGES_REQUIRED`
- Candidate-ID: `HEAD 420a67a + BE-057 diff 2a40d52359f5`
- Alcance: revalidación focalizada de auditoría, rollback, denegación tenant-bound, saneamiento y atomicidad. Sin consulta adicional de contrato, ADR o HU.

| Criterio | Implementación revisada | Prueba / evidencia |
|---|---|---|
| Éxito deja usuario, rol, activación y auditoría inequívoca | `ProvisionInitialCompanyAdminService` emite `PROVISION_INITIAL_COMPANY_ADMIN/SUCCESS` dentro del `TransactionTemplate`; V21 admite el vocabulario | `ProvisionInitialCompanyAdminServiceTest` y `AuditEntryMigrationTest` PASS |
| 403 tenant-bound no muta y deja `DENIED` durable, con empresa/operación | `LoginConfiguration` captura `Forbidden` tras el rollback y llama a `RecordCompanyDenialAuditCommand(companyId, acción)` | cero mutación: PASS en `ProvisionInitialCompanyAdminServiceTest`; acción y empresa en fachada: PASS en `RecordCompanyDenialAuditTest`; **falta una prueba ejecutada de la ruta BE-057 que persista el `DENIED` post-rollback** |
| 409 revierte, no duplica y deja `CONFLICT` durable | `Conflict` sale de `TransactionTemplate`; el catch posterior registra `PROVISION_INITIAL_COMPANY_ADMIN/CONFLICT` | `InitialCompanyAdminUniquenessIntegrationTest` PASS: una cuenta y auditorías `SUCCESS` + `CONFLICT` en PostgreSQL |
| Fallo de writer en éxito no deja éxito parcial | `audit.record` ocurre dentro de la lambda transaccional; `RecordPlatformCompanyAudit` lanza si `append` no persiste | **falta una prueba dirigida BE-057 que inyecte fallo del writer y demuestre cero cuenta, token y notificación persistidos** |
| Auditoría no contiene PII, contraseña, token, payload ni cabeceras | ambas fachadas crean `AuditEntry` con `before/after = Map.of()`; los comandos solo transportan UUID, acción y resultado | revisión dirigida y pruebas de auditoría/migración PASS |
| Regresión directa: autorización y unicidad tenant-scoped | autorización previa a mutación; V20 y store conservan unicidad por empresa | `ProvisionInitialCompanyAdminServiceTest` e `InitialCompanyAdminUniquenessIntegrationTest` PASS |

## Comandos y evidencia

- `mvn -Dtest=ProvisionInitialCompanyAdminServiceTest,InitialCompanyAdminControllerTest,RecordCompanyDenialAuditTest,InitialCompanyAdminUniquenessIntegrationTest,AuditEntryMigrationTest test` — PASS: 25 pruebas, 0 fallos/errores/omitidas. Incluye PostgreSQL/Testcontainers y Flyway hasta V21.
- `mvn -Dtest=CompanyCreationTransactionTest test` — PASS: 7 pruebas, 0 fallos/errores/omitidas. Prueba análoga: confirma atomicidad por fallo de writer y denegación durable para creación de empresa, pero no cubre `ProvisionInitialCompanyAdminUseCase`; no cierra las brechas.
- `git diff --check` y comprobación equivalente de archivos no rastreados del candidato — PASS; solo avisos de normalización LF/CRLF, sin errores de espacios.
- Firma rápida: HEAD `420a67a`; árbol de trabajo mantiene el conjunto BE-057 declarado.

## Hallazgos

- **MEDIUM — Cobertura ejecutable insuficiente de atomicidad ante fallo del writer en BE-057.** Reproducción: configurar el writer de `RecordPlatformCompanyAuditUseCase` para lanzar o devolver `false`, ejecutar un aprovisionamiento válido mediante el bean de `LoginConfiguration` y verificar que no persisten cuenta, token de activación, notificación ni auditoría de éxito.
- **MEDIUM — Cobertura ejecutable insuficiente de auditoría durable para 403 tenant-bound en BE-057.** Reproducción: configurar un `AuthenticatedActor` `PLATFORM_SUPERADMIN` con `tenantId`, ejecutar el bean de `LoginConfiguration` contra PostgreSQL y verificar `403`, cero cuenta/token/notificación y una entrada `DENIED` con acción `PROVISION_INITIAL_COMPANY_ADMIN`, `resource_id=companyId`, tenant y correlación del actor, sin PII.

## Regresión relevante y riesgos residuales

- La remediación no altera autorización previa ni las restricciones tenant-scoped; las pruebas dirigidas las cubren.
- No debe avanzar a Seguridad final hasta que Desarrollo agregue y ejecute las dos pruebas BE-057 descritas. El comportamiento análogo de creación de empresa no sustituye evidencia del bean/configuración afectado.
