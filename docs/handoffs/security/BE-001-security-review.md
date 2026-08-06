# Revisión final de Seguridad — BE-001 — Crear una empresa

## Estado

`BLOCKED`

Existe un hallazgo `HIGH` abierto en la migración de auditoría. Conforme a la regla de liberación de Seguridad, el candidato no puede avanzar a DoF. No se modificó código, pruebas, dependencias, configuración, contrato, paquete, preflight ni otros handoffs.

## Identidad y gates validados

- **HU / aplicación:** `BE-001` / `backend/followupbussiness`.
- **Paquete:** `docs/handoffs/governance/BE-001-context-package.md`, revisión vigente `7`.
- **Candidato:** HEAD `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0` más diff no staged SHA-256 `b4947b96ee6f039c2a5aeca0bfecbafefa479071c4b14c17779f525638a5c4bd`.
- **Staging:** vacío; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- **Manifiesto funcional Backend:** 28 rutas; SHA-256 canónico `6a42c21d1dcfdacbb1d79c3de22e79215fa39846bb6ea4b436a9f753670bee5e`.
- **Desarrollo:** última sección `READY_FOR_HANDOFF`, misma revisión/candidato.
- **QA:** última sección append-only `PASS`, misma revisión/candidato. El `CHANGES_REQUIRED` y manifiesto `a6cccc…` son históricos y no se usaron como aprobación.

Triage: `APLICA`. El diff crea una API privilegiada y modifica autorización, aislamiento multiempresa, esquema de auditoría, contexto confiable y transacciones. Son superficies obligatorias de Seguridad según `shared/TEAM_WORKFLOW.md`.

## Superficie revisada y modelo de amenaza

- **Activos:** privilegio `PLATFORM_SUPERADMIN`; sesiones revocables; límite de tenant; empresa/configuración; evidencia de auditoría append-only; `correlationId`.
- **Actores:** superadministrador legítimo; actor anónimo/revocado; usuario empresarial; principal manipulado o inconsistente; clientes repetidos/concurrentes.
- **Límites de confianza:** cliente no confiable → autenticación/autorización → `CompanyController` → `CreateCompanyService` → PostgreSQL compartido (`tenancy` + `audit`) → respuesta/telemetría saneada.
- **Abusos priorizados:** elevación de rol, tenant injection, mass assignment, replay/carrera, configuración que debilita tracking/retención, confused deputy interdominio, transacción parcial, scope de auditoría contaminado, correlación inyectada y fuga de datos.

La inspección se limitó a las 28 rutas del manifiesto y a consumidores directamente afectados por V14. El riesgo de compatibilidad reveló una fuente no identificada por la matriz inicial, por lo que se reabrieron excepcionalmente y solo para ese riesgo:

| Fuente | Motivo | SHA-256 |
|---|---|---|
| `db/migration/V10__support_anonymous_authentication_audit_and_refresh_history.sql` | V14 cambia la invariante creada para auditoría de autenticación sin tenant | `f624b739b74385dee81958a10d770f1d7ad378b94bee4323eb76d232b06d1000` |
| `audit/adapter/out/persistence/JdbcAuthenticationAuditAdapter.java` | Consumidor del scope `ANONYMOUS_AUTH` | `a93b3610ff6020fa441b6fb040b4a75a847e7c40b619cbe72e99c204c5960112` |
| `identityaccess/application/RefreshService.java` | Propaga `companyId == null` del principal de plataforma a auditoría | `c2b4d9f8a11083bc29bb3cdc56c35a9d0a8a1d092a1a6d1a51bc2ec9117190b2` |
| `identityaccess/application/LogoutSessionService.java` y `identityaccess/config/LoginConfiguration.java` | Confirman auditoría y revocación en la misma transacción | `93fc9a1442f8b42920d9b791798388b5ff8f73847f47916fb313803fe987da40` / `6ff50b8971a9c52214920b46fcb0b14f86c8037450edf9b7207f6ec3b7452306` |

## Matriz `SEC-BE001-01..08`

| Control | Resultado | Evidencia verificable |
|---|---|---|
| `SEC-BE001-01` | `PASS` | `SecurityConfiguration` exige autoridad exacta; `CreateCompanyService` vuelve a exigir rol `PLATFORM_SUPERADMIN` y `tenantId == null`; el proveedor de contexto de auditoría repite la validación. QA cubrió `401/403` y actor tenant-bound. |
| `SEC-BE001-02` | `PASS` | DTO y Jackson cerrados; UUID/estado/retención se generan en servidor. `RecordPlatformCompanyAuditCommand` acepta solo `resourceId` y resultado, sin actor, rol, tenant, headers, payload o tiempo. |
| `SEC-BE001-03` | `NOT_EXECUTED` para la carrera real; diseño `PASS` | `uq_tenancy_company_code` y `INSERT ... ON CONFLICT DO NOTHING` impiden duplicado durable y QA verificó conflicto/repetición. No existe evidencia de dos creaciones concurrentes reales con el mismo `code`; no se infiere como fallo explotable, pero la prueba de abuso obligatoria queda pendiente. |
| `SEC-BE001-04` | `PASS` | Invariantes de dominio y DB fijan radio `100`, frecuencia `60`, retención `90`, zona horaria/moneda y atomicidad de configuración. Pruebas negativas dirigidas `PASS`. |
| `SEC-BE001-05` | `FAIL` parcial | El puerto específico, recurso `COMPANY`, acción cerrada y mapas vacíos cumplen minimización; sin embargo, un rechazo dentro del caso de uso no deja auditoría durable (hallazgo `SEC-BE001-F02`). |
| `SEC-BE001-06` | `PASS` | La correlación se normaliza una vez y se comparte entre respuesta y auditoría; UUID válido se conserva e inválido no se refleja. Respuestas neutrales y `no-store`; no hay payload, token, cabeceras, configuración ni PII en auditoría/logs del cambio. |
| `SEC-BE001-07` | `FAIL` | El contexto de creación aplica `PLATFORM + tenantId null`, pero la restricción V14 invalida el scope preexistente `ANONYMOUS_AUTH` sin tenant de sesiones de plataforma (hallazgo `SEC-BE001-F01`). |
| `SEC-BE001-08` | `PASS` para la creación | `tenancy` y el escritor crítico usan el mismo `DataSource`; no hay `REQUIRES_NEW`. PostgreSQL/Testcontainers verificó commit conjunto y rollback de empresa/configuración/auditoría. Los privilegios destructivos del escritor/purgador permanecen denegados por la capa de auditoría. |

## Hallazgos

### `SEC-BE001-F01` — V14 impide auditar y revocar sesiones de plataforma sin tenant

- **Severidad:** `HIGH`.
- **Controles:** `SEC-BE001-05`, `SEC-BE001-07`; superficie colateral de autenticación/sesión causada por la migración afectada.
- **Activo:** sesión revocable de `PLATFORM_SUPERADMIN` y auditoría durable.
- **Condición/evidencia:** V10 elimina el `NOT NULL` de `audit_entry.tenant_id` para auditoría anónima. `JdbcAuthenticationAuditAdapter` inserta scope `ANONYMOUS_AUTH` con el `tenantId` de la sesión; para `PLATFORM_SUPERADMIN` ese valor es nulo. V14 solo permite `tenant_id IS NULL` cuando `scope = 'PLATFORM'`. `LogoutSessionService` revoca y luego audita; `LoginConfiguration` ejecuta ambas acciones en una transacción, por lo que la violación del `CHECK` revierte la revocación. Refresh presenta el mismo fallo al auditar la rotación.
- **Abuso reproducible:** (1) sobre V13, conservar o insertar una evidencia válida `ANONYMOUS_AUTH` con `tenant_id NULL` y aplicar V14: la validación del nuevo constraint falla; o (2) sobre V15 limpio, crear una familia de sesión de `PLATFORM_SUPERADMIN` con `company_id NULL` e invocar refresh/logout: el `INSERT` de auditoría viola `ck_audit_entry_scope_tenant`; la transacción de logout revierte y la sesión permanece activa.
- **Impacto:** una base con evidencia histórica puede no desplegar V14; en una base limpia el superadministrador no puede refrescar ni revocar durablemente su sesión. El fallo de logout mantiene vigente una sesión privilegiada que el usuario intentó terminar.
- **Recomendación:** reconciliar ADR-022/V14 con el contrato preexistente de auditoría de autenticación; definir una matriz cerrada de scopes/tenant que preserve `ANONYMOUS_AUTH` legítimo sin abrir tenant injection. Agregar prueba de upgrade V13→V14 con evidencia tenantless y pruebas PostgreSQL de refresh/logout de plataforma que demuestren revocación, auditoría y rollback correctos.
- **Estado:** abierto.

### `SEC-BE001-F02` — El rechazo dentro del caso de uso no deja evidencia durable

- **Severidad:** `MEDIUM`.
- **Controles:** `SEC-BE001-01`, `SEC-BE001-05`, `SEC-BE001-07`.
- **Activo:** trazabilidad de intentos privilegiados y detección de principal inconsistente.
- **Condición/evidencia:** `CreateCompanyService.execute` lanza `AccessDeniedException` antes de invocar el puerto de auditoría cuando el actor es nulo, no es `PLATFORM_SUPERADMIN` o porta tenant. `CompanyController` transforma ese camino en `403`. La prueba `rejectsNonPlatformOrTenantBoundActorsBeforeWriting` confirma cero escritura, pero no existe evidencia de auditoría para ese intento que ya alcanzó el caso de uso, en contradicción con CA-04/`SEC-BE001-05`.
- **Abuso reproducible:** presentar un principal inconsistente con autoridad `PLATFORM_SUPERADMIN` y `tenantId` no nulo. La regla web permite la autoridad, el caso de uso deniega, responde `403` y no queda registro durable del intento.
- **Impacto:** se pierde evidencia de un intento de elevación/contaminación de tenant precisamente en la segunda barrera de autorización. No se demostró bypass de creación.
- **Recomendación:** auditar el rechazo en un límite confiable antes de salir del caso de uso, o impedir que alcance el caso de uso y registrar el denial en la frontera de autorización; el comando no debe aceptar actor/rol/tenant del cliente. Reconciliar el diseño con el contexto confiable que actualmente rechaza ese principal.
- **Estado:** abierto.

## Comandos y resultados resumidos

- `graphify query "company create platform superadmin tenant audit trusted transactional correlation idempotent authorization security" --dfs --budget 2500` — `PASS`; acotó el flujo a controlador, servicio, contexto confiable, auditoría y transacción.
- `git rev-parse HEAD`, `git status --porcelain=v1 -uall`, `git diff --cached --name-status` — `PASS`; HEAD esperado, 28 rutas Backend y staging vacío.
- Huella de `git diff --binary` con la serialización UTF-8/CRLF registrada — `PASS`, `b4947b96…`.
- `git diff --check` — `PASS`.
- `mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest#concurrentRefreshCreatesOneSuccessorAndOneContractualReplay+logoutRevokesOnlyAuthenticatedTenantFamiliesDurablyAndIdempotently" test` — `PASS`, 2 pruebas, 0 fallos/errores/omitidas. Confirma que el consumidor `ANONYMOUS_AUTH` sigue funcionando con tenant empresarial; no cubre la variante diferencial de plataforma sin tenant.
- Abuso exacto `PLATFORM_SUPERADMIN + company_id NULL` en refresh/logout — `NOT_EXECUTED`: no existe una prueba dirigida en el candidato. La incompatibilidad se verifica por el predicado SQL de V14 y el flujo transaccional citado; esta ausencia forma parte del hallazgo, no se interpreta como `PASS`.
- Suites BE-001 ya evidenciadas por Desarrollo/QA — reutilizadas, no repetidas: MVC, contexto confiable, migraciones, creación/rollback y arquitectura `PASS` sobre el mismo candidato.

## Controles no aplicables y riesgos residuales

- WebSocket, Redis/cache, RabbitMQ, archivos/exportaciones, almacenamiento local/mobile, muestras de geolocalización, dependencias, secretos, infraestructura y CI/CD: `NOT_APPLICABLE`; el manifiesto no cambia esas superficies. No se ejecutaron SCA/SAST/DAST ni escaneos generales.
- La API no procesa ubicaciones; solo fija configuración/retención ya cubierta por `SEC-BE001-04`.
- Riesgo residual aun tras corregir los hallazgos: falta ejecutar la carrera real de dos creaciones con el mismo `code` y comprobar exactamente una empresa/configuración, un ganador y conflictos neutrales con correlación.
- `SEC-BE001-01`, `02`, `04`, `06` y `08` pueden reutilizar su evidencia si la remediación queda limitada a V14/consumidores de auditoría y al registro durable del rechazo. `SEC-BE001-03`, `05` y `07` requieren revalidación dirigida sobre el nuevo candidato.

## Recepción de revisor solo lectura — F03 — 2026-08-05

- **Revisor / rol:** `cybersecurity_reviewer`.
- **Candidate-ID:** `BE001-CAND-4aa8dcd92b42-01f5c2d14d09-4132505871d1`.
- **Digest de la respuesta estructurada recibida:** `NO_DISPONIBLE`; no se dispone en el contexto ni en el informe canónico de una respuesta estructurada completa de F03 susceptible de calcular y transcribir literalmente.
- **Transcrito por:** Orquestador.
- **Integridad:** `Literal`.

### Estado de recepción

`BLOCKED`

No se transcribe un dictamen F03 porque falta su contenido estructurado completo. En particular, no están disponibles para copia literal las rutas y líneas, escenario de abuso, comando y dos fallos de integración, acción requerida, excepciones de lectura y superficies `NOT_APPLICABLE`. El informe canónico existente declara `BLOCKED`, no `CHANGES_REQUIRED`; por ello no se valida ese estado ni se registra la ruta de remediación solicitada.

## Recepción de revisor solo lectura — F03 — 2026-08-05 — FINAL

- **Revisor / rol:** `cybersecurity_reviewer`.
- **Fecha:** `2026-08-05`.
- **Candidate-ID:** `BE001-CAND-4aa8dcd92b42-01f5c2d14d09-4132505871d1`.
- **Digest de la respuesta estructurada recibida:** SHA-256 `93f2c323cb9f5b6508bce160ceeaf14c2f43506ce42bf9201a46fbe3e67d1071` (bloque literal `## Dictamen de Ciberseguridad`, UTF-8/LF).
- **Transcrito por:** Orquestador.
- **Integridad:** `Literal`.

## Dictamen de Ciberseguridad

**Tipo:** `FINAL`  
**Historia:** `BE-001`  
**Estado formal:** `CHANGES_REQUIRED`

### Candidato y firma rápida

- **Candidate-ID:** `BE001-CAND-4aa8dcd92b42-01f5c2d14d09-4132505871d1`
- **HEAD:** `4aa8dcd92b42d189e4dec3e1ed8506c6b82089e0`
- **Diff:** `01f5c2d14d09845dfcd40b24d1697036ca18f5f3da6e726e905e9a6eb8bee60e`
- **Staging:** vacío, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- **Manifiesto:** 41 rutas, SHA-256 `4132505871d1dfe807b8d9be7321e2218184bf1e4d8245c83743c7310264b00f`
- **Verificación rápida:** `PASS`. El HEAD y staging observados coinciden; paquete, Desarrollo `READY_FOR_HANDOFF` y QA `PASS` declaran la identidad fijada por el ledger.
- **Manifiesto estricto:** `NOT_EXECUTED`; se reutiliza la verificación de revisión 16 conforme a la política proporcional.

### Superficie revisada

Autenticación y logout, revocación de familias de sesión, tickets pendientes móviles, escritura final de auditoría y frontera transaccional compartida con PostgreSQL.

### Modelo de riesgo

- **Activos:** revocación durable de sesiones; digest del ticket de revocación; evidencia `LOGGED_OUT`; correlación; semántica transaccional de logout empresarial, móvil y privilegiado.
- **Actores:** `PLATFORM_SUPERADMIN` tenantless; usuario empresarial autenticado; poseedor de ticket móvil; escritor de auditoría o PostgreSQL en fallo.
- **Límite de confianza:** solicitud de logout → identidad/ticket validado → `LogoutSessionService` → puerto público de auditoría → `TransactionTemplate` → PostgreSQL → respuesta HTTP.
- **Abuso:** provocar un fallo de auditoría durante un logout empresarial o pendiente móvil. El servicio lo clasifica como el fallo especial previsto para preservar la revocación privilegiada, el wrapper lo convierte en resultado transaccional normal y permite confirmar una mutación sin la evidencia de auditoría exigida.

## Hallazgo `SEC-BE001-F03`

**Título:** La excepción de commit seguro para logout privilegiado se aplica a todos los tipos de logout  
**Severidad:** `MEDIUM`  
**Estado:** abierto  
**Controles afectados:** `SEC-BE001-08` directamente; por pérdida de trazabilidad, porción aplicable de `SEC-BE001-05`.

### Evidencia

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionService.java:65-68`: cualquier `RuntimeException` de la auditoría final se transforma en `AuditUnavailableAfterRevocation`, sin limitarse a `PLATFORM_SUPERADMIN` tenantless.
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/LoginConfiguration.java:96-104`: el wrapper captura esa excepción dentro de la transacción, la devuelve como resultado para permitir el commit y la relanza después.
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java:44`: confirma el comportamiento especial requerido para plataforma tenantless.
- El mismo archivo, líneas `49` y `51`, conserva las invariantes vigentes para logout móvil pendiente y logout empresarial: ante fallo de auditoría esperan la excepción original y rollback. Ambas fallan en el candidato.

### Reproducción

Desde `backend/followupbussiness`:

```text
mvn -q "-Dtest=RefreshSessionTransactionIntegrationTest" test
```

Resultado: `FAIL`; 14 pruebas ejecutadas, 2 fallos, 0 errores y 0 omitidas:

1. `mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails`
2. `auditFailureRollsBackLogoutRevocation`

Ambas esperaban `IllegalStateException`, pero recibieron `LogoutSessionService.AuditUnavailableAfterRevocation`, originada en `LogoutSessionService.java:68`.

En el wiring productivo, esa excepción es capturada dentro de `TransactionTemplate`. Por tanto, un fallo final de auditoría en logout empresarial o pendiente móvil puede confirmar revocación/consumo del ticket sin `audit_entry`, aunque la operación termine exponiendo un error.

### Impacto

- Extiende silenciosamente una excepción diseñada para la seguridad de sesiones privilegiadas a sesiones empresariales y tickets móviles.
- Puede consumir el ticket móvil o confirmar una revocación sin evidencia durable de logout.
- Rompe dos pruebas-invariante vigentes que no han sido sustituidas por ADR o contrato.
- No se observó bypass de autenticación, cruce de tenant ni resurrección de una sesión privilegiada; por ello la severidad es `MEDIUM`.

### Acción exacta de remediación

- Limitar `AuditUnavailableAfterRevocation` y el commit posterior al caso autorizado: logout autenticado de `PLATFORM_SUPERADMIN` con actor y familia tenantless.
- Para logout empresarial y pendiente móvil, propagar el fallo original dentro de la transacción y conservar las semánticas vigentes de rollback, incluida la restauración del digest/ticket.
- Mantener verdes las tres invariantes: plataforma tenantless confirma revocación ante fallo final; logout empresarial revierte ante fallo de auditoría; ticket móvil pendiente recupera su estado.
- Añadir una prueba del wiring real de `LoginConfiguration`, no solo un `TransactionTemplate` construido manualmente.
- No resolver el hallazgo cambiando las expectativas de las pruebas de líneas 49 y 51 para aceptar indiscriminadamente la nueva excepción.

**Responsable:** propietario técnico de `identityaccess`/`audit`  
**Fecha objetivo:** no definida por el revisor.

### Comandos y resultados

- `git rev-parse HEAD`, `git status --porcelain=v1`, `git diff --cached --name-only`: `PASS`.
- Consulta Graphify focalizada en `LogoutSessionService` y auditoría transaccional: `PASS`; localizó únicamente servicio, puerto, wrapper y prueba de integración afectados.
- Primera ejecución Maven en sandbox: `NOT_EXECUTED`, repositorio local `C:\.m2\repository` no accesible.
- Reejecución autorizada del Maven dirigido: `FAIL`, 14 pruebas y 2 fallos reproducibles.
- SAST, SCA, DAST y escaneos generales: `NOT_EXECUTED`; el diff focalizado no los justifica.

### Excepciones de lectura

Ninguna. No se releyeron historia, OpenAPI ni ADR. Se usaron el paquete canónico, los handoffs Dev/QA, las rutas afectadas y los controles de seguridad vinculados a F03.

### Superficies `NOT_APPLICABLE`

WebSocket, Redis/cache como almacenamiento, RabbitMQ/mensajería, archivos/exportaciones, ubicación, datos personales, secretos, almacenamiento local del cliente móvil, dependencias, infraestructura y CI/CD.

### Riesgos residuales

- La prueba privilegiada simula el fallo mediante un puerto que lanza una excepción antes de escribir; un fallo real de PostgreSQL durante commit permanece `NOT_EXECUTED`.
- El candidato continúa sin commit y debe conservar exactamente su identidad para que esta evidencia sea reutilizable.

## Revalidación final de Seguridad — cierre `SEC-BE001-F03` — 2026-08-05

- **Tipo:** `FINAL`.
- **Historia:** `BE-001`.
- **Estado:** `PASS`.
- **Candidate-ID:** `BE001-CAND-4aa8dcd92b42-1d008a7a2207-27a855431b51`.
- **Firma rápida:** `PASS`; paquete revisión 19, Desarrollo `READY_FOR_HANDOFF` y QA Backend `PASS` declaran HEAD `4aa8dcd92b42…`, diff `1d008a7a2207…`, staging vacío y firma de 41 rutas `27a855431b51…`. Manifiesto estricto `NOT_EXECUTED`.

### Superficie y modelo de riesgo

- **Activos:** revocación durable de familias de sesión, evidencia de auditoría `LOGGED_OUT`, digest del ticket MOBILE y aislamiento tenant.
- **Actores:** `PLATFORM_SUPERADMIN` tenantless, usuario tenant-bound, poseedor de ticket MOBILE y escritor de auditoría/PostgreSQL en fallo.
- **Límite de confianza:** JWT o ticket no confiable → principal validado/controlador → `LogoutSessionService` → wrapper transaccional → auditoría/PostgreSQL.
- **Abuso contrastado:** provocar el fallo final de auditoría para confirmar una revocación tenant-bound o consumir un ticket MOBILE sin evidencia. El bypass queda inalcanzable en ambos casos: exige actor servidor `PLATFORM_SUPERADMIN`, `actor.tenantId == null` y `family.companyId == null`; el resto repropa la excepción original dentro de la transacción y revierte.

### Evidencia

- `LogoutSessionService.java:66-79`: `AuditUnavailableAfterRevocation` sólo se emite cuando se cumplen conjuntamente rol privilegiado y ausencia de tenant en actor y familia; para tenant-bound y actor nulo se relanza el fallo original.
- `InboundJwtAuthenticator.java:58-71`, `LogoutController.java:32,49` y `JdbcRefreshSessionAdapter.java:58-61`: rol, tenant, cuenta y familia se derivan/verifican en servidor antes del caso de uso; el cliente no aporta el actor que habilita la excepción.
- `LoginConfiguration.java:96-104`: el wrapper sólo confirma y relanza fuera de la transacción `AuditUnavailableAfterRevocation`; cualquier otro fallo conserva rollback.
- QA independiente `PASS`: `platformLogoutCommitsRevocationWhenFinalAuditFails`, `auditFailureRollsBackLogoutRevocation` y `mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails`; PostgreSQL/Flyway/Testcontainers, más regresión completa de `RefreshSessionTransactionIntegrationTest`.
- Delta F03 limitado a `LogoutSessionService.java` y `RefreshSessionTransactionIntegrationTest.java`; contratos, migraciones, `DataSource`, `PlatformTransactionManager` y `REQUIRES_NEW`: sin cambio. Pruebas adicionales, SAST, SCA y DAST: `NOT_EXECUTED`, no justificados por el diff ni necesarios para la decisión.

### Hallazgos, controles no aplicables y riesgo residual

- **Hallazgos abiertos:** ninguno; `SEC-BE001-F03` queda cerrado.
- **No aplicables:** secretos, datos personales/ubicación, almacenamiento local, WebSocket, cache/Redis, mensajería, archivos, dependencias e infraestructura.
- **Riesgo residual:** no se simuló un fallo real de PostgreSQL durante commit; el candidato sigue sin commit y cualquier cambio en sus 41 rutas invalida esta evidencia. El texto de gate de la revisión 19 del paquete precede al `PASS` QA append-only, aunque Candidate-ID y firma rápida coinciden.
