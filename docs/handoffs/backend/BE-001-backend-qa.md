# Handoff QA Backend — BE-001 — Crear una empresa

## Identidad

- **HU:** `BE-001 — Crear una empresa`.
- **Fase:** QA Backend independiente.
- **Estado:** `CHANGES_REQUIRED`.
- **Paquete de contexto:** `docs/handoffs/governance/BE-001-context-package.md`, revisión 6.
- **Handoff de Desarrollo revisado:** `docs/handoffs/backend/BE-001-development-handoff.md`, `READY_FOR_HANDOFF`.
- **Preflight reutilizado:** `docs/handoffs/security/BE-001-security-preflight.md`, último estado `ADVISORY`.
- **ADR aplicado:** `docs/architecture/adr/ADR-022-auditoria-transaccional-creacion-empresa-plataforma.md`.

## Candidato revisado

| Campo | Valor |
|---|---|
| HEAD | `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` |
| Diff no staged | SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd` |
| Staging | Vacío; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Manifiesto funcional Backend | 28 rutas; SHA-256 `a6cccc5eea3fecb36c6929f538908851ffb97b1c042e865cb72affd44d2a24c9` |

La identidad anterior coincide con el candidato fijado en el paquete revisión 6. No se modificaron rutas funcionales durante esta QA.

## Entradas revisadas

- Paquete, criterios CA-01..04 y controles `SEC-BE001-01..08`.
- Handoff de Desarrollo y sus cinco pruebas BE-001/modificadas.
- ADR-022, contrato OpenAPI afectado y migraciones `V14`/`V15`.
- Implementación `tenancy`/`audit` afectada y límites de arquitectura.

## Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| CA-01 / SEC-BE001-03 | Alta UUID/`ACTIVE`, índice único `code`, `201`/`Location`, conflicto `409` | `CreateCompanyServiceTest`, `CompanyCreationTransactionTest`, V15 | PASS |
| CA-02 / SEC-BE001-04 | Validación cerrada y constantes 100 m, 60 s, 90 días | `CreateCompanyServiceTest`; configuración Jackson estricta | PASS |
| CA-03 / SEC-BE001-01,02,07 | Rol de plataforma, `tenantId == null`, cruce por puerto público | Pruebas dirigidas; `HexagonalArchitectureTest`; `ModuleBoundaryTest` | PASS |
| CA-04 / SEC-BE001-05 | Auditoría PostgreSQL y transacción común | `CompanyCreationTransactionTest`, `AuditEntryMigrationTest` | PASS |
| CA-04 / SEC-BE001-06,08 | Correlación saneada en HTTP y contexto de auditoría | `CompanyControllerTest`; inspección de adaptadores | CHANGES_REQUIRED |

## Comandos y evidencia

- `git diff --check` — PASS.
- `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest,CompanyCreationTransactionTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,SecurityConfigurationTest" test` — PASS. Ejecutado contra el candidato; Flyway aplicó V14/V15 sobre PostgreSQL Testcontainers.
- Las verificaciones arquitectónicas de capas y límites de módulo incluidas en el comando anterior — PASS.

## Hallazgo

### ALTA — `correlationId` de auditoría puede diferir del devuelto al cliente

**Evidencia:** `CompanyController` genera un UUID saneado para la respuesta desde el encabezado recibido (`CompanyController.java`, línea 41). `SecurityContextPlatformAuditTrustedContextProvider` vuelve a leer el encabezado y, ante el mismo valor inválido, genera otro UUID (`SecurityContextPlatformAuditTrustedContextProvider.java`, línea 27). Ambos `UUID.randomUUID()` son independientes.

**Reproducción:** realizar `POST /platform/companies` con principal válido `PLATFORM_SUPERADMIN` sin tenant, cuerpo válido y `X-Correlation-Id: not-a-uuid`. La respuesta entrega UUID A; la fila de `audit_entry` se guarda con UUID B.

**Impacto:** incumple CA-04 y `SEC-BE001-06`: no hay propagación trazable de la correlación entre respuesta y evidencia durable. La prueba actual únicamente asegura que no se refleje el valor inválido, no que ambos destinos compartan el UUID saneado.

**Acción requerida:** normalizar el `correlationId` una sola vez por solicitud y hacer que la respuesta y el contexto confiable de auditoría reutilicen ese mismo valor; agregar prueba integrada que compare `X-Correlation-Id`/cuerpo de respuesta con `audit_entry.correlation_id` para encabezado inválido y UUID válido.

## Regresión relevante y riesgo residual

- Sin regresión observada en migraciones, rollback transaccional, aislamiento de tenant ni límites de arquitectura en las verificaciones dirigidas.
- Hasta aplicar la acción requerida, una auditoría de creación no puede correlacionarse de forma fiable con la respuesta cuando la cabecera es inválida.
- No se iniciaron Seguridad final ni DoF.

## Revalidación append-only — CA-04 / SEC-BE001-06 — 2026-08-05

### Estado

`PASS`

### Candidato y alcance revalidados

- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío; diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`.
- Se mantuvieron las 28 rutas Backend del manifiesto de la revisión 7. La revalidación se limita a la normalización y propagación de `X-Correlation-Id`, evidencia de auditoría y regresión de creación/atomicidad.

### Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| CA-04 / SEC-BE001-06 — UUID válido | `CompanyController` conserva el UUID recibido en el atributo de solicitud; el proveedor lo reutiliza y `RecordPlatformCompanyAudit` lo persiste en `audit_entry.correlation_id`. | Inspección de flujo HTTP → contexto confiable → `JdbcAuditEntryStore`; UUID válido no se regenera. | PASS |
| CA-04 / SEC-BE001-06 — encabezado inválido | El controlador normaliza una vez el valor inválido y respuesta/contexto reutilizan el atributo UUID. | `CompanyControllerTest.invalidCorrelationIsNormalizedOnceForResponseAndPlatformAuditContext` (MVC); `CompanyCreationTransactionTest.persistsTheNormalizedRequestCorrelationInThePlatformAudit` (PostgreSQL). | PASS |
| CA-04 / SEC-BE001-06 — minimización | Respuestas de error son neutrales y `no-store`; la auditoría registra mapas vacíos y no recibe payload, cabeceras, credenciales ni PII. | Inspección de `CompanyController.problem`, `CompanyValidationErrorHandler` y `RecordPlatformCompanyAudit`; prueba MVC de valor inválido no reflejado. | PASS |
| CA-04 — creación y atomicidad | Creación, configuración y auditoría comparten transacción; error del escritor revierte las tres superficies. | `CreateCompanyServiceTest` y `CompanyCreationTransactionTest` con Flyway/PostgreSQL Testcontainers. | PASS |

### Comandos y evidencia

- `git diff --check` — PASS; HEAD, diff y staging coinciden con el candidato fijado.
- `mvn -q "-Dtest=CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest,CompanyCreationTransactionTest,CreateCompanyServiceTest" test` — PASS: 11 pruebas, 0 fallos, 0 errores, 0 omitidas; incluye MVC y PostgreSQL/Flyway/Testcontainers.
- Inspección dirigida: `CompanyController` normaliza y guarda el UUID antes de invocar el caso de uso; `SecurityContextPlatformAuditTrustedContextProvider` prioriza dicho atributo; `RecordPlatformCompanyAudit` usa solo metadatos mínimos y `JdbcAuditEntryStore` persiste la misma correlación.

### Hallazgos

Ninguno.

### Regresión relevante y riesgo residual

- No se observó regresión en creación, persistencia de configuración ni rollback de auditoría.
- La remediación permanece acotada a `POST /platform/companies`; otros endpoints no forman parte de BE-001.
- No se inició Seguridad final ni DoF.

### Trazabilidad de candidato — revisión 7

- **Paquete:** `docs/handoffs/governance/BE-001-context-package.md`, revisión `7`.
- **Candidato revalidado:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; manifiesto funcional Backend de 28 rutas SHA-256 `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`.
- El manifiesto `a6cccc5eea3fecb36c6929f538908851ffb97b1c042e865cb72affd44d2a24c9` corresponde a la QA inicial histórica; no identifica el candidato aprobado en esta revalidación `PASS`.

## Revalidación independiente de remediación F01/F02 — 2026-08-05

### Estado

`CHANGES_REQUIRED`

### Candidato revisado

- Paquete de contexto: revisión `9`.
- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; diff no staged SHA-256 `9df4c4b0176b9be6a4f4ccd7d000592254d2920167a2a9f31683c05069284ca0`; staging vacío.
- Manifiesto funcional Backend: 31 rutas, SHA-256 `21e5aa97645fef9e54e43859bd786f4a71cd6d305ee7bf41110e9c9b787354af`.

### Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| F01 / `SEC-BE001-07` | V14 permite `ANONYMOUS_AUTH` tenantless, exige tenant nulo para `PLATFORM` y falla cerrado para las demás combinaciones. | Upgrade PostgreSQL/Flyway V13→V14: `AuditEntryMigrationTest#v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed`. | PASS |
| F01 / `SEC-BE001-08` | Refresh tenantless audita la rotación; logout de plataforma propaga error de auditoría después de preservar revocación. | `RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit`, `#platformLogoutCommitsRevocationWhenFinalAuditFails`, `#auditFailureRollsBackConsumedDigestAndSuccessor`. | PASS |
| `SEC-BE001-03` | Índice/transacciones de creación evitan duplicado por `code`. | `CompanyCreationTransactionTest#concurrentCreatesOfTheSameCodeProduceOneCompanyAndOneConflict` con PostgreSQL/Flyway y dos transacciones. | PASS |
| F02 / `SEC-BE001-05` | `CreateCompanyService` invoca el puerto de auditoría para actor `PLATFORM_SUPERADMIN` tenant-bound antes de denegar. | `CompanyCreationTransactionTest#tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany`. | FAIL |
| F02 / `SEC-BE001-07` | Contexto de auditoría descarta el tenant presentado y construye alcance `PLATFORM`. | La misma integración no persiste la evidencia requerida al propagar la excepción dentro de la transacción. | FAIL |

### Comandos y evidencia

- `git diff --check` — PASS; staging vacío. Se comprobó la identidad de candidato fijada por el paquete (HEAD, diff y manifiesto indicados arriba).
- `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyCreationTransactionTest#concurrentCreatesOfTheSameCodeProduceOneCompanyAndOneConflict+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany,AuditEntryMigrationTest#v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed,RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit+platformLogoutCommitsRevocationWhenFinalAuditFails+auditFailureRollsBackConsumedDigestAndSuccessor,HexagonalArchitectureTest,ModuleBoundaryTest" test` — FAIL: 14 pruebas, 1 fallo, 0 errores; Testcontainers/PostgreSQL y Flyway aplicaron V1…V15. Las evidencias F01, carrera e invariantes de arquitectura de ese comando pasaron; la falla siguiente es concluyente.

### Hallazgos

#### ALTA — F02 no persiste la auditoría durable del rechazo tenant-bound

- **Evidencia:** `CreateCompanyService.execute` escribe `DENIED` y de inmediato lanza `AccessDeniedException`. El `TransactionTemplate` de `TenancyConfiguration` y la prueba de integración propagan la excepción, por lo que PostgreSQL revierte también la inserción de `audit_entry`. La aserción de evidencia durable falla en `CompanyCreationTransactionTest.java:91`: esperaba `1`, obtuvo `0`.
- **Reproducción:** ejecutar el comando dirigido anterior, o crear un `AuthenticatedActor` con rol `PLATFORM_SUPERADMIN` y `tenantId` no nulo dentro de una transacción que invoque `CreateCompanyService`. Se rechaza la creación y quedan `0` empresas, pero también `0` filas `PLATFORM`/`DENIED` con la correlación esperada.
- **Impacto:** incumple F02 y `SEC-BE001-05`/`07`: se pierde la evidencia durable, saneada y mínima del intento privilegiado que alcanzó el caso de uso. No se observó bypass de creación.
- **Acción requerida:** ajustar el límite transaccional para que el rechazo se entregue como resultado de la transacción después de confirmar la evidencia, o aplicar una estrategia equivalente aprobada que conserve la denegación, no cree empresa/configuración y no permita datos de tenant/payload en la auditoría. Añadir/reparar la integración PostgreSQL que compruebe una única evidencia `DENIED` durable y el fallo del escritor sin respuesta exitosa.

### Regresión relevante y riesgos residuales

- F01 no reprodujo la revocación insegura: plataforma sin tenant refresca/audita y el logout mantiene revocada la familia cuando falla la auditoría; el fallo de auditoría de refresh no deja sucesor/consumo persistente.
- La carrera real de creación mantiene una empresa y una configuración; V14 supera upgrade V13→V14 con auditoría tenantless legítima.
- No se marcaron como fallo las superficies no afectadas (`SEC-BE001-01`, `02`, `04`, `06` reutilizables; WebSocket, cache, mensajería y similares `NOT_APPLICABLE`). Hasta corregir F02, Seguridad final y DoF no están autorizados.

## Revalidación independiente — SEC-BE001-F02 — 2026-08-05

### Estado

`CHANGES_REQUIRED`

### Candidato revisado

- Paquete de contexto: revisión `10`; preflight de remediación: último estado `ADVISORY`; ADR aplicado: `ADR-022`.
- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`.
- Manifiesto funcional Backend: 31 rutas, SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`.

### Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| F02 / `SEC-BE001-03,05,07` — rechazo tenant-bound durable | `CreateCompanyService` devuelve resultado interno `denied`; `TenancyConfiguration` confirma la única transacción y sólo después lanza `AccessDeniedException`. `RecordPlatformCompanyAudit` persiste alcance `PLATFORM`, tenant nulo, resultado `DENIED`, correlación confiable y mapas vacíos. | `CompanyCreationTransactionTest#tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany` sobre PostgreSQL/Flyway: `0` empresas/configuraciones y exactamente `1` evidencia `PLATFORM`/`DENIED` con tenant nulo y correlación esperada. | PASS |
| F02 — respuesta y minimización | El controlador traduce `AccessDeniedException` a `403` neutral, `no-store` y `X-Correlation-Id`; el proveedor reutiliza la correlación normalizada de solicitud. | `CompanyControllerTest#companyBoundPlatformRoleIsRejectedByUseCaseBeforePersistence` y las pruebas MVC de correlación inválida: PASS. | PASS |
| F02 — error del escritor | El escritor falla dentro de la misma transacción antes de producir el resultado de rechazo. | `CompanyCreationTransactionTest#tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited`: excepción de infraestructura, sin empresa, configuración ni auditoría ficticia. | PASS |
| CA-04 / `SEC-BE001-05` — éxito atómico | Empresa, configuración y auditoría usan el `JdbcTemplate`/`DataSource` de la transacción de tenancy; no se añadió `REQUIRES_NEW` ni otro gestor/datasource para esta ruta. | `#commitsCompanySettingsAndPlatformAuditInOneTransaction` y `#rollsBackCompanyAndSettingsWhenAuditFails`: PASS; inspección de `TenancyConfiguration` y `AuditConfiguration`. | PASS |
| Límites de arquitectura | El cruce tenancy→audit se mantiene por el puerto público `RecordPlatformCompanyAuditUseCase`; las pruebas de arquitectura no detectan dependencia prohibida. | `HexagonalArchitectureTest`, `ModuleBoundaryTest`: PASS. | PASS |
| Regresión de control del proveedor | `SecurityContextPlatformAuditTrustedContextProvider` ahora admite un `PLATFORM_SUPERADMIN` con tenant para poder registrar el rechazo F02, pero su prueba vigente sigue exigiendo que lo rechace. | `SecurityContextPlatformAuditTrustedContextProviderTest#rejectsTenantBoundOrNonPlatformActors`: FAIL, esperaba excepción y no se lanzó. | CHANGES_REQUIRED |

### Comandos y evidencia

- `git diff --check` — PASS; HEAD y staging coinciden con el candidato fijado.
- `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction+rollsBackCompanyAndSettingsWhenAuditFails+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS: 12 pruebas, 0 fallos; PostgreSQL Testcontainers y Flyway aplicaron V1…V15.
- `mvn -q "-Dtest=CompanyControllerTest" test` — PASS: 3 pruebas, 0 fallos; confirma `403` y respuesta saneada.
- `mvn -q "-Dtest=CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest" test` — FAIL: 4 pruebas, 1 fallo; el único fallo es el hallazgo siguiente.

### Hallazgos

#### MEDIA — prueba de autorización afectada conserva una expectativa incompatible con F02

- **Evidencia:** `SecurityContextPlatformAuditTrustedContextProviderTest#rejectsTenantBoundOrNonPlatformActors` exige `SecurityException` para `PLATFORM_SUPERADMIN` con `tenantId` no nulo. La remediación cambia el proveedor para devolver contexto saneado (sin tenant) y permitir exclusivamente que el caso de uso ya denegado escriba `DENIED`; por ello la prueba falla.
- **Reproducción:** ejecutar `mvn -q "-Dtest=CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest" test` en `backend/followupbussiness`; resultado: 1 fallo en ese método, sin errores.
- **Acción requerida:** actualizar la prueba para distinguir el rechazo del caso de uso (que debe seguir devolviendo `403` y no persistir empresa/configuración) de la excepción necesaria de auditoría F02; conservar prueba explícita de que actor no plataforma sigue rechazado y que el contexto `PLATFORM` nunca propaga `tenantId`. No modificar F01 fuera de ese ajuste acotado.

### Regresión relevante y riesgos residuales

- No se reprodujo regresión funcional F02: la denegación queda durable tras el `403`, con una única auditoría saneada, y el fallo del escritor no se disfraza de evidencia confirmada.
- F01 no se reejecutó: el diff F02 no modifica sus rutas de refresh/logout; su evidencia `PASS` del candidato de revisión 9 se reutiliza. WebSocket, cache, mensajería e idempotencia no son superficies modificadas (`NOT_APPLICABLE`).
- Hasta que la prueba afectada quede consistente y verde, no procede Seguridad final ni DoF.

## Revalidación independiente — Enmienda MVP de auditoría de denegación F02 — 2026-08-05

### Estado

`CHANGES_REQUIRED`

### Candidato y matriz resumida

- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; diff no staged SHA-256 `488d3105072f4b27ddff29dc8b78f9ff69a1e367bbcee8c627c6b1a61d2cb8ba`.
- Manifiesto funcional Backend: 40 rutas, SHA-256 `d761488aece4868ea0e723f2f284d8260ce61ce16a36a4cc85e9348b2352918a`.

| Criterio/control | Implementación | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| F02 / `SEC-BE001-05` — puerto y contexto reales | `CreateCompanyService` invoca exclusivamente `RecordCompanyDenialAuditUseCase` para actor `PLATFORM_SUPERADMIN` tenant-bound; el proveedor derivado conserva `actorId`, `tenantId` y correlación servidor. El puerto de plataforma sigue rechazando tenant-bound. | Inspección de dependencias; `RecordCompanyDenialAuditTest`, `SecurityContextCompanyDenialAuditTrustedContextProviderTest`, `SecurityContextPlatformAuditTrustedContextProviderTest` y PostgreSQL `CompanyCreationTransactionTest`. | PASS |
| F02 / `SEC-BE001-05` — evidencia mínima e idempotencia | El comando solo contiene `attemptId`; `RecordCompanyDenialAudit` fija `COMPANY`/`CRITICAL_MUTATION`/`DENIED`, `TENANT_BOUND_DENIAL` y mapas vacíos. El intento se genera en servidor y la PK/`ON CONFLICT DO NOTHING` evita duplicado del mismo ID. | Prueba unitaria repite el mismo comando; integración PostgreSQL confirma una evidencia durable con actor/tenant/correlación reales y cero empresa/configuración. | PASS |
| F02 / `SEC-BE001-08` — commit antes de 403 y fallo del escritor | `TenancyConfiguration` convierte `Result.denied()` en `AccessDeniedException` después de `TransactionTemplate.execute`; el controlador responde 403 neutral. El fallo del escritor se propaga. | `CompanyCreationTransactionTest` y `CompanyControllerTest` con PostgreSQL/Flyway/Testcontainers. | PASS |
| `SEC-BE001-07` — matriz cerrada V16 | V16 y `AuditEntry` mantienen `PLATFORM + tenant null`, `TENANT_BOUND_DENIAL + tenant no nulo` y `ANONYMOUS_AUTH`. | `AuditEntryMigrationTest` valida las combinaciones cruzadas relevantes y upgrade V13→V16, pero no scope desconocido. | CHANGES_REQUIRED |
| `SEC-BE001-08` — mismo gestor/DataSource, sin gestor alterno | El escritor especial recibe el `JdbcTemplate` de tenancy, pero `TenancyConfiguration` crea `new DataSourceTransactionManager(...)` en lugar de usar el `PlatformTransactionManager` de la aplicación. | Inspección estática de `TenancyConfiguration`; las integraciones prueban atomicidad con ese `DataSource`, no identidad del gestor ni wiring Spring. | CHANGES_REQUIRED |
| Regresión creación legítima/F01 | Alta de plataforma conserva empresa, configuración y auditoría `PLATFORM` en una transacción; rollback de auditoría revierte las tres. F01 no cambió en el delta F02. | `CompanyCreationTransactionTest`; evidencia previa reutilizable de F01/V14 por rutas no modificadas. | PASS |

### Comandos y evidencia

- `git diff --check` — PASS.
- `mvn -q "-Dtest=RecordCompanyDenialAuditTest,SecurityContextCompanyDenialAuditTrustedContextProviderTest,SecurityContextPlatformAuditTrustedContextProviderTest,CreateCompanyServiceTest,CompanyCreationTransactionTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,CompanyControllerTest" test` — PASS; pruebas dirigidas, PostgreSQL/Testcontainers y Flyway hasta V16.
- El intento de demostración adicional con `jshell` quedó `NOT_EXECUTED` por permisos de preferencias de Java en el sandbox; no afecta los hallazgos, sustentados directamente por las invariantes Java y SQL inspeccionadas.

### Hallazgos

#### ALTA — V16 y el dominio aceptan scopes desconocidos

- **Evidencia:** `AuditEntry` acepta cualquier `scope` distinto de `PLATFORM`, `TENANT_BOUND_DENIAL` y `ANONYMOUS_AUTH` si trae tenant; V16 repite la apertura mediante `scope NOT IN (...) AND tenant_id IS NOT NULL`. Esto contradice la allowlist exigida para dominio y PostgreSQL.
- **Reproducción:** tras Flyway V16, insertar una fila `audit_entry` con `scope='UNRECOGNIZED_SCOPE'` y `tenant_id` no nulo; la condición final de V16 la acepta. Análogamente, construir `AuditEntry` con ese scope y tenant no nulo no lanza excepción.
- **Acción requerida:** cerrar la allowlist en `AuditEntry` y V16 preservando únicamente los scopes históricos aprobados; añadir pruebas Java y PostgreSQL para scope desconocido y para cada combinación histórica válida.

#### MEDIA — el límite crea un segundo `PlatformTransactionManager`

- **Evidencia:** `TenancyConfiguration#createCompanyUseCase` instancia `new DataSourceTransactionManager(jdbcTemplate.getDataSource())`; no recibe ni reutiliza el `PlatformTransactionManager` de la aplicación. El control exige el mismo gestor, no solo un `DataSource` equivalente.
- **Reproducción:** arrancar el contexto Spring con el gestor de la aplicación y revisar el bean `CreateCompanyUseCase`: el wrapper usa otra instancia creada localmente. Las integraciones actuales solo prueban que ambas escrituras comparten el `DataSource` de prueba.
- **Acción requerida:** inyectar/reutilizar el gestor transaccional de tenancy y añadir una prueba de wiring que compruebe identidad de `DataSource` y `PlatformTransactionManager`, sin `REQUIRES_NEW` ni gestor alternativo.

### Regresión relevante y riesgos residuales

- La creación legítima atómica y la denegación con evidencia previa a 403 pasaron en PostgreSQL/Flyway. Arquitectura hexagonal y límites de módulos pasaron.
- Persisten los riesgos de contaminación de la matriz por scope no reconocido y de divergencia de configuración transaccional entre el gestor creado localmente y el gestor de aplicación. Superficies no tocadas (WebSocket, Redis, mensajería, móvil e infraestructura) son `NOT_APPLICABLE`.

## Revalidación independiente — V16 allowlist y gestor transaccional — 2026-08-05

### Estado

`PASS`

### Candidato y delimitación

- Paquete canónico `BE-001`, revisión `16`; preflight vigente `ADVISORY`; ADR-022 y su enmienda aplicados.
- Candidato fijado: HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, staging Backend vacío y manifiesto Backend de 41 rutas SHA-256 `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`. La revisión 16 reconcilia esta identidad con el último handoff de Desarrollo.
- Diff revisado primero: allowlist en `AuditEntry` y V16, inyección de `PlatformTransactionManager` en `TenancyConfiguration` y sus pruebas afectadas. Sin cambios de contrato HTTP, mensajería, cache ni WebSocket.

### Matriz resumida

| Criterio/control | Implementación | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| V16 / `SEC-BE001-07` — scope desconocido con y sin tenant falla cerrado | `AuditEntry` limita a `AUTHORIZED_RESOURCE`, `PLATFORM`, `TENANT_BOUND_DENIAL` y `ANONYMOUS_AUTH`; V16 reproduce la allowlist SQL. | `AuditEntryTest` y `AuditEntryMigrationTest#rejectsUnknownScopesWithAndWithoutTenantAndPreservesTheClosedScopeMatrix`, PostgreSQL/Flyway V16: rechazos Java y SQL, y combinaciones permitidas. | PASS |
| Matriz ADR-022/enmienda | `PLATFORM` exige tenant nulo; `TENANT_BOUND_DENIAL` exige tenant real; autenticación histórica se conserva. | `AuditEntryMigrationTest#v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed` y prueba de matriz anterior. | PASS |
| `SEC-BE001-08` — único gestor/transacción | `TenancyConfiguration` recibe `PlatformTransactionManager` y lo entrega al único `TransactionTemplate`; no crea gestor local. | `CompanyCreationTransactionTest#usesTheInjectedTenancyTransactionManagerForTheAtomicCreationPath`. | PASS |
| CA-04 / éxito y fallo atómicos | Empresa, configuración y escritor crítico usan el `JdbcTemplate` de aplicación dentro del mismo límite. | `CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction` y `#rollsBackCompanyAndSettingsWhenAuditFails`, PostgreSQL/Flyway. | PASS |
| F02 / DENIED tenant-bound, identidad real e idempotencia | Puerto separado deriva actor/tenant/correlación confiables y persiste `TENANT_BOUND_DENIAL`; fallo del escritor no se presenta como denegación. | `CompanyCreationTransactionTest#tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+#tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited`; `RecordCompanyDenialAuditTest` y proveedor de contexto. | PASS |
| F01 / regresión tenantless | Refresh/logout de plataforma conserva auditoría de autenticación tenantless y revocación ante fallo final. | `RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit+#platformLogoutCommitsRevocationWhenFinalAuditFails`. | PASS |
| Límites hexagonales | El cruce tenancy→audit permanece por puertos públicos; no se detectó dependencia prohibida. | `HexagonalArchitectureTest`, `ModuleBoundaryTest`. | PASS |

### Comandos y evidencia

- `git diff --check` — PASS.
- `mvn -q "-Dtest=AuditEntryTest,AuditEntryMigrationTest#rejectsUnknownScopesWithAndWithoutTenantAndPreservesTheClosedScopeMatrix+v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed,CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction+rollsBackCompanyAndSettingsWhenAuditFails+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited+usesTheInjectedTenancyTransactionManagerForTheAtomicCreationPath,RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit+platformLogoutCommitsRevocationWhenFinalAuditFails,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS; Testcontainers PostgreSQL y Flyway aplicaron V1…V16.
- `mvn -q "-Dtest=RecordCompanyDenialAuditTest,SecurityContextCompanyDenialAuditTrustedContextProviderTest,SecurityContextPlatformAuditTrustedContextProviderTest,CompanyControllerTest,CreateCompanyServiceTest" test` — PASS; puerto correcto/incorrecto, identidad confiable, idempotencia y `403` neutral.

### Hallazgos

- Ninguno.

### Regresión relevante y riesgos residuales

- Regresión dirigida F01/F02, atomicidad, aislamiento tenant y límites de arquitectura: PASS. La carrera de creación, configuración detallada, correlación HTTP y demás superficies no modificadas reutilizan evidencia previa verificable; cache, WebSocket, RabbitMQ, móvil e infraestructura: `NOT_APPLICABLE`.
- Riesgo residual: el candidato permanece sin commit y depende de que no cambien sus 41 rutas antes del gate siguiente; una modificación exige reconciliar el paquete y revalidar esta evidencia.

## Revalidación independiente — SEC-BE001-F03 — 2026-08-05

### Estado

`PASS`

### Candidato y delimitación

- **Candidate-ID:** `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`.
- Gate documental: paquete revisión 19 y handoff de Desarrollo no vacíos, ambos `READY_FOR_HANDOFF`, HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`, staging vacío, diff `1d008a7a…` y firma Backend de 41 rutas `27a85543…` coherentes.
- Delta F03 inspeccionado: `LogoutSessionService` y `RefreshSessionTransactionIntegrationTest`. No modifica contrato HTTP, migraciones, `DataSource` ni `PlatformTransactionManager`; no se observa `REQUIRES_NEW`.

### Matriz resumida

| Criterio/control | Implementación | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| F03 — `PLATFORM_SUPERADMIN` tenantless | El manejo excepcional sólo aplica si actor confiable es `PLATFORM_SUPERADMIN`, actor y familia carecen de tenant; el wrapper transaccional confirma la revocación y expone `AuditUnavailableAfterRevocation`. | `RefreshSessionTransactionIntegrationTest#platformLogoutCommitsRevocationWhenFinalAuditFails`, PostgreSQL/Flyway/Testcontainers. | PASS |
| F03 — logout tenant-bound | El fallo de auditoría se repropa sin excepción especial; el límite transaccional revierte revocación y no deja auditoría. | `#auditFailureRollsBackLogoutRevocation`, PostgreSQL/Flyway/Testcontainers. | PASS |
| F03 — MOBILE pending | Fallos de instalación o auditoría repropan y restauran digest, sin revocación ni auditoría parcial. | `#mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails`, PostgreSQL/Flyway/Testcontainers. | PASS |
| Límites del delta | Sin cambio F03 de contrato, migración, `DataSource` o `PlatformTransactionManager`. | Inspección del diff focalizado y del handoff de Desarrollo; `git diff --check`. | PASS |

### Comandos y evidencia

- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest#platformLogoutCommitsRevocationWhenFinalAuditFails+auditFailureRollsBackLogoutRevocation+mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails" test` — PASS.
- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest" test` — PASS; regresión directa de la clase afectada.
- `git diff --check` — PASS.

### Hallazgos

- Ninguno.

### Regresión relevante y riesgos residuales

- Refresh/logout tenantless ya cubierto por la regresión directa; el bypass queda acotado al actor y familia tenantless de plataforma. Contratos, migraciones, wiring de `DataSource`/`PlatformTransactionManager`, cache, mensajería y frontend: `NOT_APPLICABLE` para F03.
- Riesgo residual: el candidato continúa sin commit; cualquier alteración de sus 41 rutas exige reconciliar la identidad y revalidar esta evidencia.
