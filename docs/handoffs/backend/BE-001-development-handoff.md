# Backend Handoff — BE-001

## Estado

`READY_FOR_HANDOFF`

## Alcance evaluado

Crear una empresa desde `POST /platform/companies` con configuración inicial, control de plataforma, unicidad concurrente, respuesta con correlación y auditoría durable atómica, conforme al paquete de contexto revisión efectiva 2 y al preflight `ADVISORY`.

## Bloqueo

`SEC-BE001-05` no puede implementarse sin ampliar una dependencia pública y resolver una decisión de arquitectura:

- El único puerto público reutilizable de `audit`, `RecordAuditEntryUseCase`, obtiene su contexto desde `SecurityContextAuditTrustedContextProvider`, que rechaza expresamente a todo actor sin `tenantId`. El actor requerido por BE-001 es `PLATFORM_SUPERADMIN` y debe tener `tenantId == null`.
- El vocabulario público `AuditResourceType` no incluye `COMPANY`; no existe una acción/recurso de plataforma para esta mutación.
- `AuditConfiguration` construye `JdbcAuditEntryStore` con un `DataSource` de escritura separado. Por tanto, una invocación desde la transacción de creación de `tenancy_company` no demuestra la atomicidad exigida: si la auditoría falla, no hay mecanismo contractual vigente para revertir la creación, ni viceversa.

Crear un adaptador de auditoría dentro de `tenancy`, acceder a sus tablas, fabricar un tenant o registrar la operación solo como log violaría los límites y controles definidos. Ampliar el puerto/auditoría para operaciones de plataforma y definir la participación transaccional requiere decisión/ADR y revisión explícita de consumidores, tal como exige el paquete.

## Archivos inspeccionados

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/port/in/RecordAuditEntryUseCase.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/security/SecurityContextAuditTrustedContextProvider.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/config/AuditConfiguration.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/domain/AuditResourceType.java`
- `backend/followupbussiness/src/main/resources/db/migration/V4__create_tenancy_company_access_status.sql`

No se modificaron fuentes Backend, contratos ni migraciones.

## Verificación ejecutada

| Comando | Resultado |
|---|---|
| `mvn -q -Dtest=CompanyAccessStatusMigrationTest test` | PASS; migración vigente y consulta de estado de empresa verificadas con PostgreSQL/Testcontainers. |

## Criterios y controles

- `CA-01` a `CA-04`: no implementados por el bloqueo previo de auditoría atómica.
- `SEC-BE001-01` a `SEC-BE001-06`: no ejecutados; `SEC-BE001-05` es el bloqueo determinante.

## Riesgos y reproducción

El riesgo es crear un tenant sin evidencia durable o dejar auditoría sin empresa tras un fallo. Se reproduce intentando usar `RecordAuditEntryUseCase` bajo un `AuthenticatedActor` `PLATFORM_SUPERADMIN` con `tenantId == null`: `SecurityContextAuditTrustedContextProvider.current()` lo rechaza. Aun ampliando esa validación, el `DataSource` independiente configurado para auditoría impide demostrar rollback conjunto.

## Acción requerida

Definir y aprobar una ampliación del contrato de auditoría para mutaciones de plataforma sin tenant, con vocabulario `COMPANY`, contexto de correlación confiable y una estrategia transaccional común con `tenancy`. Tras esa decisión, actualizar el paquete/preflight si cambia la superficie y reanudar Desarrollo.

## Reanudación ADR-022 — 2026-08-05

El precheck de Seguridad para ADR-022 quedó `ADVISORY`; se implementó BE-001 sobre el paquete de contexto revisión 5. Estado de Desarrollo: `READY_FOR_HANDOFF`.

### Alcance implementado

- `POST /platform/companies` exige `PLATFORM_SUPERADMIN`; el caso de uso repite la validación de actor de plataforma sin tenant y no toma tenant, rol, actor, estado, UUID ni tiempos del payload.
- `tenancy` crea empresa `ACTIVE`, configuración completa de MVP y código único. La inserción usa la restricción durable de código y devuelve conflicto sin segunda empresa.
- `audit` expone únicamente `RecordPlatformCompanyAuditUseCase`; su comando acepta solo `resourceId` generado en servidor y resultado cerrado. El adaptador deriva actor, rol, tenant nulo, hora y correlación saneada desde el contexto confiable.
- Empresa, configuración y auditoría crítica usan el mismo `JdbcTemplate`/`DataSource` dentro de un `TransactionTemplate`; un fallo de auditoría revierte las escrituras de `tenancy`.

### Archivos y contratos

- Puerto y contexto: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/port/in/RecordPlatformCompanyAuditUseCase.java` y `.../audit/adapter/out/security/SecurityContextPlatformAuditTrustedContextProvider.java`.
- Caso de uso, persistencia y REST: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/application/CreateCompanyService.java`, `.../tenancy/adapter/out/persistence/JdbcCompanyCreationStore.java` y `.../tenancy/adapter/in/rest/CompanyController.java`.
- Migraciones forward-compatible: `backend/followupbussiness/src/main/resources/db/migration/V14__allow_platform_audit_scope.sql` y `V15__create_company_onboarding.sql`.
- No se modificó OpenAPI: el endpoint, códigos y esquemas ya estaban publicados en `docs/api/openapi.yaml`.

### Verificación

| Comando | Resultado |
|---|---|
| `mvn -q -DskipTests compile` | PASS |
| `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyCreationTransactionTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` | PASS |
| `mvn -q -Dtest=SecurityConfigurationTest test` | PASS |
| `git diff --check` | PASS |

Las pruebas cubren los caminos de éxito/conflicto y la atomicidad de CA-01, CA-03 y CA-04, además de `SEC-BE001-01`, `03`, `05`, `07` y `08` en unidad, migración o integración PostgreSQL. CA-02/`SEC-BE001-04` se aplican mediante las invariantes de `CompanySettings`, pero aún no tienen prueba negativa dedicada. `SEC-BE001-02` y `06` se cubren parcialmente por DTO cerrado, generación de valores y correlación segura; requieren validación independiente HTTP negativa para propiedades extra, cabeceras y respuestas. No se ejecutó una carrera HTTP real; la unicidad queda protegida por el índice durable y debe verificarse en QA.

### Riesgos y reproducción

- Riesgo residual: no se añadió una prueba MVC específica para `400/401/403/409/422`, ni una carrera HTTP real. QA puede reproducir el conflicto enviando dos altas con el mismo `code`; debe persistir una sola empresa/configuración y responder `409` a la perdedora con `X-Correlation-Id`.
- Para comprobar atomicidad, fuerce un error del escritor de auditoría durante el alta: `CompanyCreationTransactionTest` demuestra que no quedan filas en `tenancy_company`, `tenancy_company_settings` ni `audit_entry`.
- Candidato actual: `HEAD 4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` más el diff Backend sin staging; no se realizaron commits.

## Revalidación de candidato y cobertura completa — 2026-08-05

### Identidad reproducible

- `HEAD`: `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`.
- Staging: vacío; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Diff rastreado no staged (`git diff --binary`, UTF-8): SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`.
- Manifiesto funcional Backend: rutas modificadas/no rastreadas, ordenadas como `ruta SHA-256(contenido)` y unidas con LF; SHA-256 `a6cccc5eea3fecb36c6929f538908851ffb97b1c042e865cb72affd44d2a24c9`.

| Ruta | SHA-256 |
|---|---|
| `audit/adapter/out/security/SecurityContextPlatformAuditTrustedContextProvider.java` | `fe6c28047df023fcbe5cfc1b003e667c9529148a081f3dc9d3aba53caeb28566` |
| `audit/application/{PlatformAuditTrustedContext,RecordPlatformCompanyAudit,RecordPlatformCompanyAuditCommand}.java` | `63924c2af1748d5603ef0d8e7aec8332f5de5e88694bbb9b0012e3dfc76ee1cf`, `f4519daa951ca3d6caf182083cb6fa6c262f65b140d362d10336ba6a18b1b77a`, `0e390cffdd887e1cff583290bd634426fb72148209672a7c265ad12ea6413338` |
| `audit/application/port/{in/RecordPlatformCompanyAuditUseCase,out/PlatformAuditTrustedContextProvider}.java` | `f3c2625b6fcaace667b0f07d02bd12329798b6706c35e271caf1ce53bfe63859`, `4bf6d38f5df8f48e40aa262a093f5d39e659d4f562b6f0bd79ced6a90e88db16` |
| `audit/config/AuditConfiguration.java`; `audit/domain/{AuditEntry,AuditResourceType,AuditScope}.java` | `435d4035af741edea0e304e9eca3ec14236b7c8cda811a5639ce3db0122f80c2`, `a0f4515697e42c2bf238d323cebf79eea4e830a3b7243d2823f9b54ddd3614c9`, `748d0eda1f514eb4097924dd9c5a530b231d7febe7542adf12bf1ef6b077397e`, `0a43049edded30a9de8a750ad5b40e7b5193750298e4f5b6a4454081632dd281` |
| `identityaccess/config/SecurityConfiguration.java` | `deb219143f60ba1612cfede1af33fcfdbe3b0fb833043bda396a3800874aeece` |
| `tenancy/adapter/in/rest/{CompanyController,CompanyValidationErrorHandler}.java` | `f10d2910e663b1a5aacfb7ac52b1a26edf76bc05e733d1de15e52413793169d1`, `bf1eb6d5b8bb74d9d4ac151076ea3f238c74510538dfe54c8af8c1a1fb7d7c15` |
| `tenancy/adapter/out/persistence/JdbcCompanyCreationStore.java`; `tenancy/config/TenancyConfiguration.java` | `b3b270d7a3a9b1bfb007087ac40efa5d8687d05ec3c3375a9996498f5bd3c1cf`, `30dba1062ba6b6cd90f11057d474b2d608b5c492613f6b571b1aeb48f093c6ea` |
| `tenancy/application/{CreateCompanyCommand,CreateCompanyService}.java` y puertos | `66e3e2e25aac60d69f2c5769e1049f81c2a10771791de70998d5fd1ba80708fe`, `aa94a8ef6eac4c515684e8cfb9313e48fb4adf0f1a66bbab9650dcb0d3b4e95e`, `10b8e013f881011ed5c2b12bf17a3cb0d5b934c749c010832edbde7d4c7c4f13`, `c00280240ea9c9f111c95c7f5a2fbc06490b6550be97cec620022c8ff37f14fb` |
| `tenancy/domain/model/{Company,CompanySettings}.java` | `b3ab1c008d54d37d1860948e68f6772fa4af124430efceae3a37800da03b5145`, `a2697993005cac4126e79acb10e67854b7d356219976f8ea0379946796e8079f` |
| `db/migration/V14__allow_platform_audit_scope.sql`; `V15__create_company_onboarding.sql` | `db2de0e06920d68ab6141c1d5c05404d79615422f3c03f0e06eb4537e6d567a3`, `c255b9ae264e208cc07738a3c733c49756aaa51077723c4a606f307d4cacfd73` |
| Pruebas `SecurityContextPlatformAuditTrustedContextProviderTest`, `AuditEntryMigrationTest`, `CompanyControllerTest`, `CreateCompanyServiceTest`, `CompanyCreationTransactionTest` | `1ed686b3697569cb9a18a5643a3e6f42b8659af4dd5825d2235653ad00724b76`, `c095afb41460ddd86bae70d97df22314d88df77c7f3c6133e22ac557ec4c00b0`, `64edec987f9508815ddf386a8079963455f8298f7a83e8b5793898499a41f5ec`, `59f08567f202a3328ccec27335b93c5455c0bf16b3368fb3f56b70b3c67cfce3`, `21133270c344d3ff51d658d9108d00924a4b78a66ea16afe7de3dc46ea670dfa` |

### Matriz de criterios y controles

| Elemento | Evidencia dirigida |
|---|---|
| CA-01 / SEC-BE001-03 | `CreateCompanyServiceTest` cubre alta y conflicto; `CompanyCreationTransactionTest` verifica una empresa/configuración auditada con PostgreSQL/Flyway; `V15` aporta índice único durable de `code`. |
| CA-02 / SEC-BE001-04 | `CreateCompanyServiceTest` rechaza radio, frecuencia, retención y zona horaria inválidos; `CompanyController` aplica validación del contrato. |
| CA-03 / SEC-BE001-01, 02, 07 | `CreateCompanyServiceTest`, `CompanyControllerTest` y `SecurityContextPlatformAuditTrustedContextProviderTest` rechazan actor no plataforma o plataforma con tenant; `SecurityConfigurationTest` prueba deserialización Boot cerrada contra propiedades extra. `V14` rechaza scope/tenant inválido. |
| CA-04 / SEC-BE001-05, 08 | `CompanyCreationTransactionTest` comprueba commit conjunto y rollback si falla auditoría; `AuditEntryMigrationTest` prueba persistencia de `PLATFORM` sin tenant. |
| SEC-BE001-06 | `CompanyControllerTest` comprueba conflicto neutral, `Cache-Control: no-store` y reemplazo de correlación inválida sin reflejarla; `SecurityConfigurationTest` cubre errores seguros de autenticación/autorización. |

Verificación reejecutada sobre el candidato descrito:

`mvn -q "-Dtest=CreateCompanyServiceTest,CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest,CompanyCreationTransactionTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,SecurityConfigurationTest" test` — `PASS`.

`git diff --check` — `PASS`.

## Remediación CA-04 / SEC-BE001-06 — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Alcance

Se remedia exclusivamente la divergencia de `correlationId` identificada por QA. `POST /platform/companies` normaliza la cabecera una vez y conserva el UUID saneado en el atributo de la solicitud. La respuesta HTTP, el manejador de validación y el proveedor de contexto confiable de auditoría reutilizan ese valor. No se altera el contrato OpenAPI, dominio, autorización, esquema ni migraciones.

### Archivos modificados

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/adapter/in/rest/CompanyController.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/adapter/in/rest/CompanyValidationErrorHandler.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/security/SecurityContextPlatformAuditTrustedContextProvider.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/adapter/in/rest/CompanyControllerTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/persistence/CompanyCreationTransactionTest.java`

### Contratos y migraciones

No hay cambios de contrato público ni migraciones. Se preserva el puerto público `RecordPlatformCompanyAuditUseCase`; la correlación sigue derivándose desde contexto de servidor y no se acepta en su comando.

### Verificación

- `mvn -q "-Dtest=CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest" test` — PASS.
- `mvn -q "-Dtest=CompanyControllerTest,SecurityContextPlatformAuditTrustedContextProviderTest,CompanyCreationTransactionTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS; incluye PostgreSQL/Flyway/Testcontainers y las restricciones de arquitectura/módulo.
- `git diff --check` — PASS.
- `python -m graphify update .` — PASS.

### Criterios, riesgo y reproducción

CA-04 y `SEC-BE001-06` quedan cubiertos para la creación: con `X-Correlation-Id` inválido, la prueba MVC compara el UUID devuelto con el contexto de auditoría y la prueba de integración PostgreSQL confirma que dicho contexto se persiste en `audit_entry.correlation_id`. Una cabecera UUID válida también conserva el valor presentado. Riesgo residual: esta remediación se limita a `POST /platform/companies`; otros endpoints con normalización local no se modificaron por estar fuera de BE-001.

Reproducción: enviar `POST /platform/companies` autenticado como `PLATFORM_SUPERADMIN` sin tenant, cuerpo válido y `X-Correlation-Id: not-a-uuid`; verificar que el encabezado de respuesta y `audit_entry.correlation_id` sean el mismo UUID saneado.

## Remediación de Seguridad F01/F02 — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Alcance y controles

Se remediaron exclusivamente `SEC-BE001-F01` y `SEC-BE001-F02`, aplicando el preflight a `SEC-BE001-03`, `05`, `07` y `08`. Se conserva la evidencia reutilizable de `SEC-BE001-01`, `02`, `04` y `06`.

- V14 admite la matriz cerrada: `PLATFORM` requiere tenant nulo; `ANONYMOUS_AUTH` admite la auditoría de sesión derivada por servidor con o sin tenant; cualquier otro scope requiere tenant no nulo. El dominio aplica la misma regla.
- Refresh y logout de `PLATFORM_SUPERADMIN` sin tenant conservan `ANONYMOUS_AUTH`, sin fabricar ni aceptar tenant de cliente. Si la auditoría final de logout falla, se confirma primero la revocación durable y el error se propaga sin respuesta exitosa; refresh revierte sucesor/consumo cuando falla su auditoría.
- El rechazo de un principal `PLATFORM_SUPERADMIN` tenant-bound dentro de `CreateCompanyService` genera una evidencia `DENIED` mínima de alcance `PLATFORM`, con tenant descartado, correlación saneada y sin empresa/configuración. Un fallo de esa auditoría no produce mutación ni se disfraza de rechazo auditado.

### Archivos, contratos y migraciones

- Implementación: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/domain/AuditEntry.java`, `.../audit/adapter/out/security/SecurityContextPlatformAuditTrustedContextProvider.java`, `.../tenancy/application/CreateCompanyService.java`, `.../identityaccess/application/LogoutSessionService.java` y `.../identityaccess/config/LoginConfiguration.java`.
- Migración modificada antes de entrega: `backend/followupbussiness/src/main/resources/db/migration/V14__allow_platform_audit_scope.sql`.
- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java`, `.../identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java`, `.../tenancy/application/CreateCompanyServiceTest.java` y `.../tenancy/persistence/CompanyCreationTransactionTest.java`.
- No se cambió contrato HTTP ni se agregó migración nueva; V14 aún no está comprometida/aplicada como release.

### Verificación

- `mvn -q "-Dtest=CreateCompanyServiceTest,AuditEntryMigrationTest#v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed,RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit" test` — PASS.
- `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyCreationTransactionTest,AuditEntryMigrationTest#v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed,RefreshSessionTransactionIntegrationTest#platformSessionWithoutTenantRefreshesAndLogsOutWithTenantlessAuthenticationAudit+platformLogoutCommitsRevocationWhenFinalAuditFails+auditFailureRollsBackConsumedDigestAndSuccessor" test` — PASS.
- `mvn -q "-Dtest=CompanyCreationTransactionTest#concurrentCreatesOfTheSameCodeProduceOneCompanyAndOneConflict" test` — PASS; PostgreSQL/Flyway con dos transacciones reales: una empresa/configuración, una alta y un conflicto, dos evidencias coherentes.
- `git diff --check` — PASS. `python -m graphify update .` — PASS.

### Identidad reproducible

- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Diff no staged SHA-256 `9df4c4b0176b9be6a4f4ccd7d000592254d2920167a2a9f31683c05069284ca0`; manifiesto Backend de 31 rutas SHA-256 `21e5aa97645fef9e54e43859bd786f4a71cd6d305ee7bf41110e9c9b787354af`.

### Riesgos y reproducción

La revalidación debe repetir los escenarios PostgreSQL/Flyway de upgrade V13→V14, refresh/logout tenantless, fallo final de auditoría de logout y rechazo tenant-bound. El fallo de auditoría de logout deja la sesión revocada y devuelve error; el fallo de auditoría de refresh no expone sucesor. No se alteraron integraciones fuera de identidad, auditoría, tenancy y V14.

## Remediación Backend — SEC-BE001-F02 — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Decisión, alcance y cambios

ADR-022 y el preflight permiten confirmar el rechazo como resultado de la única transacción y convertirlo en `AccessDeniedException` sólo después del commit; no se usa `REQUIRES_NEW`, un segundo gestor ni otro `DataSource`.

- `CreateCompanyService` representa el rechazo tenant-bound ya auditado como resultado interno, sin crear empresa ni configuración.
- `TenancyConfiguration` conserva el `TransactionTemplate` con el mismo `JdbcTemplate`/`DataSource` de `tenancy`, confirma la auditoría `DENIED` y luego entrega el rechazo que el controlador traduce a `403` neutral.
- Si el escritor de auditoría falla, el error se propaga antes de generar el rechazo auditado; no hay `2xx`, empresa, configuración ni evidencia ficticia.
- Se ajustaron `CreateCompanyUseCase.Result` y las pruebas de servicio e integración. No cambia el contrato HTTP ni se añade/modifica migración.

Archivos propios de esta remediación:

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/application/CreateCompanyService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/application/port/in/CreateCompanyUseCase.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/config/TenancyConfiguration.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/application/CreateCompanyServiceTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/persistence/CompanyCreationTransactionTest.java`

### Verificación y controles

- Reproducción previa: `mvn -q "-Dtest=CompanyCreationTransactionTest#tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany" test` — FAIL esperado antes del cambio: la auditoría se revertía y la aserción obtenía `0` filas.
- `mvn -q "-Dtest=CreateCompanyServiceTest,CompanyControllerTest,CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction+rollsBackCompanyAndSettingsWhenAuditFails+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS con PostgreSQL/Flyway/Testcontainers, MVC y arquitectura.
- `git diff --check` — PASS. `graphify update .` — PASS.

`SEC-BE001-F02`, `SEC-BE001-05` y `SEC-BE001-07` quedan cubiertos por la integración PostgreSQL: exactamente una `audit_entry` `PLATFORM`/`DENIED`, tenant nulo y correlación segura tras el `403`, con cero empresa/configuración; el fallo del escritor no se hace pasar por rechazo auditado. La prueba de commit conjunto y rollback de auditoría conserva la atomicidad de empresa/configuración/auditoría de éxito de ADR-022.

### Identidad reproducible, riesgo y reproducción

- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Diff no staged SHA-256 `da573f0dfd4b6aedc021a499f713519a41a21039d1bc0990ed6bff53bb0f616c`; manifiesto funcional Backend de 31 rutas SHA-256 `9d2e3168a5f8a0b69714759f1e1340457cd757232f1bd9971ae296335cba9374`, normalizado como `ruta relativa a backend/followupbussiness SHA-256(contenido)` y unido con LF.
- Riesgo residual: QA debe repetir de forma independiente el rechazo tenant-bound y el fallo del escritor sobre este candidato; las demás superficies de F01 y la carrera ya tienen evidencia previa reutilizable, pero no se reejecutaron para este diff acotado.
- Reproducción: invocar `CreateCompanyUseCase` con `PLATFORM_SUPERADMIN` y `tenantId` no nulo, con correlación de solicitud saneada. Debe lanzar `AccessDeniedException` después de confirmar una única auditoría `PLATFORM`/`DENIED`, sin empresa ni configuración.

## Enmienda MVP de auditoría de denegación F02 — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Alcance, límites y contratos

- Se añade el puerto público separado `RecordCompanyDenialAuditUseCase`; recibe sólo el identificador de intento generado por servidor. El contexto confiable deriva actor, tenant, tiempo y `correlationId` saneado del contexto servidor.
- La denegación tenant-bound persiste exclusivamente `COMPANY`/`CRITICAL_MUTATION`/`DENIED`/`TENANT_BOUND_DENIAL`, con tenant y actor reales, y estados vacíos. El intento es `id` y `resourceId`; reintentos del mismo identificador son idempotentes.
- `RecordPlatformCompanyAuditUseCase` se conserva para plataforma real y vuelve a rechazar actor tenant-bound. `TenancyConfiguration` confirma la evidencia con el mismo `JdbcTemplate`/`DataSource` y `DataSourceTransactionManager`, y recién después traduce el resultado a `403`.
- Si falla el escritor, el error se propaga: no hay empresa, configuración ni denegación auditada ficticia. No se añadieron `REQUIRES_NEW`, segundo gestor/DataSource, asincronía, logs sustitutos, acceso directo entre dominios ni contrato HTTP.

### Archivos, migración y pruebas

- Nuevo contrato/adaptador: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/RecordCompanyDenialAudit.java`, `RecordCompanyDenialAuditCommand.java`, `CompanyDenialAuditTrustedContext.java`, sus puertos y `SecurityContextCompanyDenialAuditTrustedContextProvider.java`.
- Integración: `.../audit/config/AuditConfiguration.java`, `.../audit/domain/{AuditEntry,AuditScope}.java`, `.../audit/adapter/out/security/SecurityContextPlatformAuditTrustedContextProvider.java`, `.../tenancy/application/CreateCompanyService.java`, `.../tenancy/config/TenancyConfiguration.java`.
- Migración: `backend/followupbussiness/src/main/resources/db/migration/V16__allow_tenant_bound_denial_audit_scope.sql`; conserva `PLATFORM` sin tenant y autenticación existente, y cierra la matriz para `TENANT_BOUND_DENIAL` con tenant real.
- Pruebas: `RecordCompanyDenialAuditTest`, `SecurityContextCompanyDenialAuditTrustedContextProviderTest`, `AuditEntryMigrationTest`, `CreateCompanyServiceTest` y `CompanyCreationTransactionTest`.
- `mvn -q "-Dtest=RecordCompanyDenialAuditTest,SecurityContextCompanyDenialAuditTrustedContextProviderTest,SecurityContextPlatformAuditTrustedContextProviderTest,CreateCompanyServiceTest,CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction+rollsBackCompanyAndSettingsWhenAuditFails+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+tenantBoundRejectionDoesNotMasqueradeAnAuditFailureAsAudited,AuditEntryMigrationTest#allowsPlatformEvidenceOnlyWithoutTenantAndRejectsInvalidScopeCombinations+allowsTenantBoundDenialOnlyWithTheRealTenant,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS.
- `mvn -q -DskipTests compile`, `git diff --check` y `python -m graphify update .` — PASS.

### Criterios, riesgo y reproducción

Se cubren F02 y `SEC-BE001-05/07/08`: evidencia durable antes del `403`, tenant/actor/scope reales, minimización y correlación, fallo del escritor e idempotencia por identificador. Se reutilizan F01, autenticación tenantless, correlación HTTP, carrera de creación y atomicidad exitosa, pues no se modificaron esas superficies.

Reproducir con `PLATFORM_SUPERADMIN` tenant-bound: debe haber una sola fila `TENANT_BOUND_DENIAL` con tenant/actor reales y cero empresa/configuración; si falla el escritor, se propaga error sin falso `403` auditado.

### Identidad del candidato

Snapshot previo a este append-only (el handoff no integra el manifiesto Backend): HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; diff SHA-256 `488d3105072f4b27ddff29dc8b78f9ff69a1e367bbcee8c627c6b1a61d2cb8ba`; manifiesto Backend de 40 rutas SHA-256 `d761488aece4868ea0e723f2f284d8260ce61ce16a36a4cc85e9348b2352918a`, como `ruta relativa a backend/followupbussiness SHA-256(contenido)` unida con LF. Sin commits.

## Remediación QA — matriz V16 y gestor transaccional — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Alcance y cambios

- `AuditEntry` y `V16__allow_tenant_bound_denial_audit_scope.sql` aplican una allowlist cerrada: `AUTHORIZED_RESOURCE` con tenant, `PLATFORM` sin tenant, `TENANT_BOUND_DENIAL` con tenant y `ANONYMOUS_AUTH` para la evidencia histórica de autenticación. Un scope desconocido se rechaza tanto con tenant como sin tenant en dominio y PostgreSQL.
- `TenancyConfiguration` recibe el `PlatformTransactionManager` de la aplicación y lo entrega al único `TransactionTemplate`; se eliminó la creación local de `DataSourceTransactionManager`. El escritor crítico de auditoría conserva el `JdbcTemplate` de la aplicación, por lo que empresa, configuración y auditoría participan en el mismo límite transaccional de ADR-022, sin `REQUIRES_NEW`.
- Se actualizaron los datos de prueba históricos de `OWN_RESOURCE` al scope contractual `AUTHORIZED_RESOURCE`.

Archivos modificados en esta remediación: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/domain/AuditEntry.java`, `backend/followupbussiness/src/main/resources/db/migration/V16__allow_tenant_bound_denial_audit_scope.sql`, `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/config/TenancyConfiguration.java`, `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/domain/AuditEntryTest.java`, `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java` y `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/tenancy/persistence/CompanyCreationTransactionTest.java`.

### Verificación y criterios

- `mvn -q "-Dtest=AuditEntryTest,AuditEntryMigrationTest#allowsPlatformEvidenceOnlyWithoutTenantAndRejectsInvalidScopeCombinations+allowsTenantBoundDenialOnlyWithTheRealTenant+rejectsUnknownScopesWithAndWithoutTenantAndPreservesTheClosedScopeMatrix+v13TenantlessAuthenticationEvidenceSurvivesV14AndTheMatrixFailsClosed,CompanyCreationTransactionTest#commitsCompanySettingsAndPlatformAuditInOneTransaction+rollsBackCompanyAndSettingsWhenAuditFails+tenantBoundPlatformRejectionPersistsSanitizedEvidenceWithoutCreatingCompany+usesTheInjectedTenancyTransactionManagerForTheAtomicCreationPath" test` — PASS; dominio, Flyway/PostgreSQL/Testcontainers, denegación durable y atomicidad.
- `mvn -q "-Dtest=RecordAuditEntryTest,RecordCompanyDenialAuditTest,SecurityContextCompanyDenialAuditTrustedContextProviderTest,SecurityContextPlatformAuditTrustedContextProviderTest,AuditEntryTest,AuditEntryMigrationTest,CreateCompanyServiceTest,CompanyCreationTransactionTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS; matriz, puertos, integración, regresión atómica y límites hexagonales.
- `git diff --check` — PASS. `python -m graphify update .` — PASS.

Se cubren los hallazgos QA: scope desconocido con/sin tenant, cada combinación admitida, integridad de V16, uso del gestor inyectado y rollback de creación/configuración/auditoría. Se reutiliza la evidencia previa de F01, refresh/logout tenantless, correlación HTTP y carrera de creación, pues estas rutas no cambiaron.

### Candidato, staging y reproducción

- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging Backend vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Diff Backend no staged (incluye 11 rutas trackeadas y 30 sin seguimiento) SHA-256 `01f5c2d14d09845dfcd40b24d1697036ca18f5f3da6e726e905e9a6eb8bee60e`; manifiesto Backend de 41 rutas SHA-256 `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`, normalizado como `ruta relativa a backend/followupbussiness SHA-256(contenido)` y unido con LF. Sin commits.
- Reproducción: ejecutar la segunda selección Maven; o intentar crear `AuditEntry`/insertar `UNRECOGNIZED_SCOPE` con tenant nulo y no nulo (ambos deben fallar). Para transacción, usar `CreateCompanyUseCase` con el gestor inyectado y provocar fallo de auditoría: no debe persistir empresa, configuración ni evidencia parcial.

Riesgo residual: QA independiente debe validar el candidato íntegro; no se introdujeron contratos HTTP, nuevos puertos ni migraciones adicionales a V16.

## Remediación de Seguridad SEC-BE001-F03 — 2026-08-05

### Estado

`READY_FOR_HANDOFF`

### Alcance y límites

- Se limita `AuditUnavailableAfterRevocation` al logout autenticado cuyo actor derivado por servidor tiene rol `PLATFORM_SUPERADMIN`, `tenantId` nulo y familia de sesión sin empresa. Sólo ese caso permite al wrapper transaccional confirmar la revocación y devolver el error posterior de auditoría.
- Un logout tenant-bound y el flujo MOBILE pendiente propagan el fallo original de auditoría dentro de la transacción: revocación, consumo del ticket y digest se revierten.
- No se modificaron contratos, migraciones, `DataSource`, `PlatformTransactionManager` ni el límite transaccional existente.

### Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionService.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java`

### Verificación y criterios cubiertos

- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest#platformLogoutCommitsRevocationWhenFinalAuditFails+auditFailureRollsBackLogoutRevocation+mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails" test` — `PASS`; PostgreSQL/Flyway/Testcontainers cubre plataforma tenantless, rollback tenant-bound y restauración de digest MOBILE pending.
- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest" test` — `PASS`; regresión directa de la clase afectada. La variante privilegiada atraviesa el bean real de `LoginConfiguration` y su `TransactionTemplate`.
- `git diff --check` — `PASS`. `python -m graphify update .` — `PASS`.

### Candidato e integridad

- **Candidate-ID propuesto para reconciliación del ledger:** `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`.
- HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`; staging vacío SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; diff worktree SHA-256 `1d008a7a22070e48f86c6325577f3973b77347e213166e5ee16c344840e4e415`.
- Manifiesto funcional Backend: 41 rutas, SHA-256 `27a855431b5195ca3f1f1d65a19502a0601034983f67a331a463291a73c545a6`, normalizado como ruta relativa a `backend/followupbussiness` más SHA-256 de contenido, unido con LF. El paquete canónico conserva la revisión 17/Candidate-ID previo hasta que el Orquestador sincronice el ledger.

### Riesgo y reproducción

Riesgo residual: queda pendiente la revalidación independiente de Seguridad sobre el candidato reconciliado; el fallo de PostgreSQL en commit real no se simuló. Reproducir con los tres métodos dirigidos anteriores: el caso tenantless debe dejar la familia revocada y lanzar `AuditUnavailableAfterRevocation`; los otros dos deben lanzar el fallo original sin mutación durable.


## Enmienda administrativa de trazabilidad — 2026-08-06

- **Responsable del registro:** Orquestador; corrección administrativa de metadatos, sin modificar evidencia, alcance, código ni pruebas de Desarrollo.
- **Paquete de contexto:** docs/handoffs/governance/BE-001-context-package.md, revisión 19.
- **Candidate-ID confirmado:** BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51; HEAD 4aa8dcd92b42…, diff 1d008a7a…, staging vacío y firma Backend de 41 rutas 27a85543….
- **Estado de Desarrollo:** se conserva READY_FOR_HANDOFF; esta nota solo completa la declaración de paquete requerida por el gate DoF.
