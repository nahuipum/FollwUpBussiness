# BE-005 — Handoff Desarrollo Backend

## Estado

`READY_FOR_HANDOFF`

## V4 notificaciones

- Contrato distribuido v4/ADR-017 materializado mediante `RevokeInstallationsForSession#revoke(UUID sessionFamilyId, UUID tenantId)`; `notifications` conserva sólo vinculaciones técnicas en V11 y no depende de `identityaccess`.
- Evidencia: pending MOBILE y logout global revocan instalaciones antes del retorno; tenant ajeno permanece activo en `RefreshSessionTransactionIntegrationTest`.
- Manifiesto funcional v4: `notifications/{application/port/in/RevokeInstallationsForSession.java,application/RevokeInstallationsForSessionService.java,adapter/out/persistence/JdbcInstallationRevocationAdapter.java,config/NotificationsConfiguration.java}`, `db/migration/V11__create_notification_installation_revocations.sql`, y consumo en `identityaccess` (`LogoutSessionService`, `RefreshSessionPort`, `JdbcRefreshSessionAdapter`, `LoginConfiguration`).
- SEC-01..11: evidencia dirigida acumulada de JWT/filtro, modalidades HTTP, revocación PostgreSQL, carrera, idempotencia, monitor global HMAC, auditoría, aislamiento tenant y V11. SEC-12: contrato v4 implementado para notificaciones; tracking continúa sin estado por decisión v4.
- Matriz por capa: `LogoutControllerTest` valida normal/WEB pending/MOBILE pending, 204, `no-store`, correlación, error neutral y borrado de cookie; `LogoutSessionServiceTest` verifica que current/MOBILE pending llama `RevokeInstallationsForSession` sólo con `sessionFamilyId+tenantId` derivados; `RefreshSessionTransactionIntegrationTest` valida V11/Flyway, pending/global, idempotencia, carrera refresh/logout y tenant ajeno intacto. El controlador no conoce el puerto interno por diseño hexagonal.
- Verificación final v4: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,RefreshSessionTransactionIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` → `BUILD SUCCESS`, 17 pruebas, 0 fallos/errores.

## Candidato

- Entrada distribuida: `docs/handoffs/governance/BE-005-context-package.md` v1 y `docs/handoffs/security/BE-005-security-preflight.md`.
- Base funcional: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`.
- Candidato v5: SHA-1 de `git diff HEAD` `1abf4404c732f33dded8e0e1f1baeea6410abab3`.
- Candidato v7: SHA-1 de `git diff HEAD` `144e0d4c4fc04619a9a5b6edf070704074940493`; `git diff --check HEAD` PASS.
- No hubo relectura de fuentes primarias ni migración: el esquema de familias ya contiene `revoked_at` y `revocation_ticket_digest`.
- Excepción registrada: se consultó selectivamente `docs/api/openapi.yaml` `/auth/logout` y `LogoutRequest` (SHA-256 `8957594B552D75588DCF24CA1ADAC906AEBA7B7EE1A18B7722436875050792D9`) por instrucción de comprobar cuerpo HTTP. Confirma `allSessions` como propiedad booleana de body; el controlador se ajustó a ello.

## Alcance implementado

- Se añadió el caso de uso de cierre y el endpoint `POST /auth/logout` en las modalidades normal autenticada, WEB pendiente con cookie y MOBILE pendiente con ticket.
- La revocación actual/global opera sobre la familia o sobre cuenta+tenant derivados del actor validado; las consultas JDBC incluyen ambos predicados y bloquean la fila para coordinar con refresh.
- El JWT conserva el `sid` validado contra PostgreSQL para que el caso de uso no tome IDs del cliente. Access y refresh ya consultan/revocan la fuente durable por familia.
- Se valida CSRF HMAC para familias WEB, se borra la cookie pendiente, los errores del endpoint son `ProblemDetail` con `no-store`/correlación, y se audita un evento técnico mínimo mediante el puerto público de auditoría.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/in/LogoutSessionUseCase.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LogoutController.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcRefreshSessionAdapter.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/{LoginConfiguration,SecurityConfiguration}.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/*` y `identityaccess/domain/model/AuthenticatedActor.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/**`
- Prueba añadida: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionServiceTest.java`
- Pruebas añadidas: `identityaccess/adapter/in/rest/LogoutControllerTest.java` y `identityaccess/adapter/out/security/RedisLogoutAbuseMonitorTest.java`.

## Contratos y migraciones

- No se modificó `docs/api/openapi.yaml`: el paquete distribuido declara el contrato existente como fuente para las tres modalidades.
- No se añadió migración: se reutilizan `identity_access_session_family.revoked_at` y `revocation_ticket_digest` de `V5`.

## Verificación

- `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutSessionServiceTest,RefreshServiceTest,RefreshControllerTest,InboundJwtAuthenticatorTest" test`: `BUILD SUCCESS`, 16 pruebas, 0 fallos/errores.
- `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=RefreshSessionTransactionIntegrationTest" test` (elevado para Docker/Testcontainers): `BUILD SUCCESS`, 3 pruebas, 0 fallos/errores; Flyway validó/aplicó V1–V10 contra PostgreSQL efímero.
- Reejecución elevada tras añadir alcance/idempotencia logout: `RefreshSessionTransactionIntegrationTest` `BUILD SUCCESS`, 4 pruebas, 0 fallos/errores.
- Matriz ampliada elevada `-Dtest=LogoutControllerTest,RedisLogoutAbuseMonitorTest,LogoutSessionServiceTest,RefreshSessionTransactionIntegrationTest`: `BUILD SUCCESS`, 13 pruebas, 0 fallos/errores.
- Remediación v2 final: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=SecurityConfigurationTest,LogoutControllerTest,LogoutSessionServiceTest,RedisLogoutAbuseMonitorTest,RefreshSessionTransactionIntegrationTest,InboundJwtAuthenticatorTest" test`: `BUILD SUCCESS`, 49 pruebas, 0 fallos/errores.
- `git diff --check`: correcto.
- `graphify update .`: correcto; grafo actualizado.

## Controles y riesgo

- Implementación/prueba fuente: SEC-BE005-01, 02, 03, 04, 05, 06, 08, 09 y 11 tienen cobertura parcial observable; la matriz unitaria dirigida ejecutó 16 pruebas sin fallos.
- SEC-BE005-07 incorpora `RedisLogoutAbuseMonitor`: usa clave HMAC sin identidad en claro, ventana de una hora y no bloquea ni revierte logout si Redis falla. La prueba `unavailableAbuseMonitorNeverPreventsDurableRevocation` lo demuestra a nivel de aplicación.
- SEC-BE005-10 no exige cambio de retención al reutilizar auditoría, pero falta su verificación ejecutada.
- SEC-BE005-12 está bloqueado por requisito de producto pendiente: el contrato exige un puerto interno de notificaciones para desvincular el dispositivo MOBILE, pero búsqueda dirigida demuestra que `notifications` y `tracking` contienen sólo `package-info`, sin puerto público/interno ni implementación. Crear uno inventaría un contrato y acoplamiento fuera del alcance.
- Remediación v2: Bearer se procesa para logout normal; PENDING omite filtro sólo sin Bearer y rechaza `Authorization`. Logout tolera familia ya revocada y las indisponibilidades de auditoría/monitor no revierten la revocación durable. No obstante, la auditoría de denegación y la carrera explícita refresh/logout siguen sin prueba observable; junto con SEC-12 externo, impiden declarar `READY_FOR_HANDOFF`.
- Falta una matriz HTTP/integración de las tres modalidades, Redis degradado/stale, carrera refresh/logout y auditoría de denegación. Por ello no es seguro avanzar a QA/Security.

## Reproducción

- V5: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,RefreshSessionTransactionIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,SecurityConfigurationTest,RedisLogoutAbuseMonitorTest" test` → `BUILD SUCCESS`, 51 pruebas, 0 fallos/errores; incluye Flyway V11/Testcontainers. `NotificationsConfiguration` crea el adaptador JDBC real sólo cuando existe `JdbcTemplate`; no hay no-op de producción.
- V6: la prueba MVC instala `InboundJwtAuthenticationFilter` y `AuthenticationPrincipalArgumentResolver`; Bearer aceptado deriva el actor y llega al caso de uso. Matriz completa `SecurityConfigurationTest,LogoutControllerTest,LogoutSessionServiceTest,RedisLogoutAbuseMonitorTest,RefreshSessionTransactionIntegrationTest,InboundJwtAuthenticatorTest,HexagonalArchitectureTest,ModuleBoundaryTest` → `BUILD SUCCESS`, 57 pruebas, 0 fallos/errores.
- V7: WEB normal autenticado admite cookie HttpOnly + CSRF y PENDING+Authorization se rechaza antes del caso de uso. Misma matriz completa → `BUILD SUCCESS`, 58 pruebas, 0 fallos/errores.

1. Desde `backend/followupbussiness`, disponer de dependencias Maven o acceso permitido a Maven Central.
2. Ejecutar `mvn -Dtest=LogoutSessionServiceTest,RefreshServiceTest,RefreshControllerTest,RefreshSessionTransactionIntegrationTest,InboundJwtAuthenticatorTest test`.
3. Completar las pruebas de contrato/integración indicadas antes de cambiar a `READY_FOR_HANDOFF`.

## Revalidación v13 — H-03 (2026-08-05)

### Identidad y entrada

- HU: `BE-005 — Cerrar y revocar sesión`.
- Paquete canónico: `docs/handoffs/governance/BE-005-context-package.md`, revisión vigente `v13`.
- Candidato: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `fe5e66df0b2cc27c9fd25d2065c2b094640a5cbd`; staging vacío.
- Evidencia incorporada desde `docs/handoffs/backend/BE-005-remediation-v13-candidate.md` (SHA-256 `FCDF5493712AE8494E0E3B34C277A19BE0F758C9E6B109C6F9D8349E9ECCD1B1`). El archivo es histórico: no es este handoff canónico ni sustituye un estado de fase.

### Delta y evidencia

- H-03 consume el digest de ticket MOBILE con una actualización condicional atómica; el éxito limpia el digest y el replay se rechaza sin un segundo `LOGGED_OUT`. La transacción existente conserva atomicidad frente a fallos posteriores.
- `mvn clean "-Dtest=LogoutSessionServiceTest" test` — PASS, 8 pruebas.
- `mvn "-Dtest=RefreshSessionTransactionIntegrationTest" test` — PASS, 9 pruebas; PostgreSQL/PostGIS Testcontainers y Flyway hasta V11.
- `git diff --check` y `graphify update .` — PASS.
- No hay contrato externo ni migración nuevos declarados.

### Estado de gate

`BLOCKED` — preflight de Seguridad v13 pendiente para el candidato anterior. Los resultados históricos `READY_FOR_HANDOFF`, `PASS` o `ADVISORY` de otra huella están invalidados y no se declaran reutilizados. El único siguiente gate permitido es el preflight; no se autoriza QA, Seguridad final ni DoF.

## Revalidación v13 — H-03 posterior al preflight (2026-08-05)

### Identidad, entradas y alcance

- HU: `BE-005 — Cerrar y revocar sesión`.
- Paquete: `docs/handoffs/governance/BE-005-context-package.md`, revisión `v13`, SHA-256 `C254E3AA4B78ED2EEA588A1DBD4FC57F8695D871668BEAC6AFEC3D4B075F5054`.
- Preflight: `docs/handoffs/security/BE-005-security-preflight.md`, «Revalidación v13 — delta H-03», `PREFLIGHT` / `ADVISORY`.
- Candidato revalidado: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `fe5e66df0b2cc27c9fd25d2065c2b094640a5cbd`; staging vacío. `git diff --check HEAD` pasa.
- Alcance: exclusivamente H-03 y `SEC-BE005-03,04,05,06,08,09,11,12`. No se modificó código, contratos ni migraciones: hacerlo cambiaría la huella fija y exige nueva revisión del paquete.

### Matriz de controles revalidados

| Control | Implementación en candidato | Prueba/evidencia en esta huella | Estado |
|---|---|---|---|
| SEC-BE005-03 | `JdbcRefreshSessionAdapter.consumeRevocationTicket` limita `MOBILE`, digest, no revocada y no vencida; `LogoutController` rechaza modalidades pending mezcladas. | `LogoutControllerTest` (5 PASS) cubre mezcla pending; `RefreshSessionTransactionIntegrationTest` (9 PASS) cubre ticket vencido y éxito MOBILE. Falta caso de ticket válido ligado a `WEB` con cero mutaciones. | INCOMPLETO |
| SEC-BE005-04 | `UPDATE ... RETURNING` limpia el digest condicionalmente y `LoginConfiguration` conserva la transacción de logout. | Integración (9 PASS) verifica éxito: digest nulo + familia revocada. Falta rollback del consumo MOBILE ante fallo posterior. | INCOMPLETO |
| SEC-BE005-05 | El consumo condicional hace un único ganador lógico. | Integración (9 PASS) cubre carrera refresh/logout, no dos consumos concurrentes del mismo ticket requeridos por el preflight. | INCOMPLETO |
| SEC-BE005-06 | Un replay devuelve `Rejected` después de que el digest fue limpiado. | `LogoutSessionServiceTest` (8 PASS) e integración (9 PASS) verifican primer uso y replay sin segundo `LOGGED_OUT`; falta replay concurrente. | INCOMPLETO |
| SEC-BE005-08 | `LogoutController` entrega error neutral `LOGOUT_INVALID`, `no-store` y correlación; el servicio no incluye ticket/digest en auditoría. | `LogoutControllerTest` (5 PASS) cubre mezcla neutral. Falta prueba/captura específica de ticket vencido y replay que demuestre ausencia de ticket, digest, familia y tenant. | INCOMPLETO |
| SEC-BE005-09 | Sólo tras familia consumida se registra `LOGGED_OUT`; audit está dentro de la transacción. | Integración (9 PASS) cuenta un `LOGGED_OUT` tras replay y cubre rollback de auditoría en logout normal. Falta rollback específicamente tras consumo MOBILE. | INCOMPLETO |
| SEC-BE005-11 | La familia y tenant provienen del `RETURNING`; instalaciones reciben sólo esos IDs técnicos. | Integración (9 PASS) verifica instalaciones de tenant ajeno intactas en éxito; falta cobertura de replay/concurrencia con ambos tenants. | INCOMPLETO |
| SEC-BE005-12 | `LogoutSessionService` usa el puerto público `RevokeInstallationsForSession` con familia/tenant resueltos. | Integración (9 PASS) comprueba revocación de instalaciones propias y exclusión ajena. Falta fallo del puerto de instalaciones con rollback de digest, sesión y auditoría, y replay sin invocación. | INCOMPLETO |

### Verificación ejecutada

- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,RefreshSessionTransactionIntegrationTest" test`: `LogoutSessionServiceTest` 8 PASS; la integración no pudo abrir Docker desde el sandbox.
- El mismo comando dirigido para `RefreshSessionTransactionIntegrationTest`, con acceso aprobado al Docker local: 9 PASS; Testcontainers PostgreSQL/PostGIS y Flyway hasta V11.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: 5 + 3 + 1 PASS.
- `git diff --check HEAD`: PASS. No se actualizó graphify porque no hubo cambio de código.

### Arquitectura, contratos y riesgos

- La inspección del delta conserva el límite `identityaccess` → puerto público `notifications`; `HexagonalArchitectureTest` y `ModuleBoundaryTest` pasan. No se requiere ADR nuevo, contrato externo ni migración para esta revalidación.
- Riesgo residual bloqueante: replay concurrente y fallo posterior del puerto de instalaciones/auditoría pueden carecer de evidencia de atomicidad total de digest, revocación, auditoría y desvinculación. También faltan pruebas explícitas del rechazo neutral para ticket `WEB` y de ausencia de filtración en vencido/replay.

### Estado y reproducción

`BLOCKED` — no se autoriza QA. El preflight v13 exige evidencia completa para todos los controles de la matriz; los vacíos anteriores no se pueden declarar satisfechos sobre este candidato. Para reanudar: acordar/crear un nuevo candidato y revisión de paquete, añadir las pruebas de integración enumeradas y ejecutar de nuevo la matriz dirigida contra su nueva huella.

## Revalidación v14 — evidencia H-03 completada (2026-08-05)

### Identidad y entradas

- HU: `BE-005 — Cerrar y revocar sesión`.
- Paquete: `docs/handoffs/governance/BE-005-context-package.md`, revisión `v14`.
- Preflight: `docs/handoffs/security/BE-005-security-preflight.md`, «Revalidación v14 — evidencia de cierre H-03», `PREFLIGHT` / `ADVISORY`.
- Candidato: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `b5ddac5b7fd730a248cca12e293984daf69e540f`; staging vacío.
- Alcance: sólo pruebas H-03; no hubo cambios productivos, contrato, migración ni ADR.

### Matriz SEC y evidencia

| Control | Implementación revalidada | Prueba / evidencia v14 | Resultado |
|---|---|---|---|
| `SEC-BE005-03` | El consumo JDBC exige digest, familia activa/no vencida y canal `MOBILE`; el controlador separa modalidades. | `webBoundRevocationTicketIsRejectedWithoutMutatingItsFamily` y `LogoutControllerTest` (6 PASS). | Completo |
| `SEC-BE005-04` | Consumo, revocación, instalaciones y auditoría usan la transacción de `LoginConfiguration`. | `mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails` (integración). | Completo |
| `SEC-BE005-05` | `UPDATE ... RETURNING` condiciona el consumo a un único ganador. | `concurrentMobileTicketConsumptionHasOneWinnerAndLeavesOtherTenantUntouched` (integración). | Completo |
| `SEC-BE005-06` | Digest se limpia tras el único consumo; el replay no resuelve familia. | Prueba concurrente anterior y `mobileReplayHasNeutralRejectionAndDoesNotRepeatInstallationRevocation` (unidad). | Completo |
| `SEC-BE005-08` | Problem neutral/no-store/correlation; el comando de auditoría usa IDs técnicos y no recibe ticket/digest. No hay nuevo logger o métrica en el flujo H-03. | `rejectedMobileTicketReturnsNeutralProblemWithoutEchoingTicket` (HTTP); `LogoutSessionServiceTest` (9 PASS) conserva auditoría tipada sin campo de ticket. | Completo para el delta; Seguridad conserva verificación independiente no-HTTP. |
| `SEC-BE005-09` | Sólo el consumo ganador llega a `LOGGED_OUT`; la auditoría participa en rollback. | Pruebas de rollback y concurrencia de integración. | Completo |
| `SEC-BE005-11` | Familia/tenant salen de la fila consumida; no se resuelven desde cliente. | Prueba concurrente crea tenant/familia ajenos y confirma digest, sesión y auditoría intactos. | Completo |
| `SEC-BE005-12` | Se usa exclusivamente `RevokeInstallationsForSession` con familia/tenant derivados. | Rollback por fallo de puerto y replay sin segunda invocación, más `ModuleBoundaryTest`. | Completo |

Controles no modificados por H-03 (`SEC-BE005-01`, `02`, `07`, `10`) no se rediseñaron ni se declaran resultados de otro candidato; su evidencia existente queda a disposición de QA para revalidación independiente.

### Verificación

- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` — PASS, 19 pruebas.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RefreshSessionTransactionIntegrationTest" test` — PASS, 12 pruebas con Testcontainers PostgreSQL/PostGIS y Flyway V1–V11.
- `git diff --check` y `graphify update .` — PASS.

### Estado de gate

`READY_FOR_HANDOFF` — la matriz H-03 afectada tiene implementación, prueba y evidencia sobre el candidato v14. Riesgo residual entregado a QA/Seguridad: verificación independiente de saneamiento no-HTTP de `SEC-BE005-08`. Este estado no sustituye `PASS` de QA ni revisión final de Seguridad.

## Remediación v15 — F14-02 (2026-08-05)

### Revalidación acotada

- Paquete canónico: `docs/handoffs/governance/BE-005-context-package.md`, revisión `v15`.
- Identidad observada: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`, staging vacío y diff tracked `524f08838e6f2b4f8719bdd0bbf67309156082bd`.
- V12 añade unicidad parcial para el digest de ticket no nulo. El adaptador bloquea coincidencias y consume sólo cardinalidad uno; cero o más de una se rechazan sin actualizar ninguna familia.
- `RevocationTicketIntegrityIntegrationTest` PASS (2): colisión cross-tenant rechazada por V12 sin mutación y esquema V11 con colisión rechazado fail-closed, sin revocación ni auditoría. La regresión `RefreshSessionTransactionIntegrationTest` PASS (12); suite dirigida/arquitectura PASS (19); `git diff --check` PASS.

### Estado de gate

`BLOCKED` — no se declara `READY_FOR_HANDOFF`. Aunque F14-02 tiene implementación, prueba y evidencia, F14-01 permanece abierto: la huella tracked no incluye V12, su prueba ni todos los archivos críticos. Se requiere manifiesto canónico completo o inclusión en Git y revalidación explícita antes de QA.

## Revalidación v16 — F14-01 y F14-02 (2026-08-05)

### Estado

`READY_FOR_HANDOFF`

### Entradas, identidad y alcance

- HU: `BE-005 — Cerrar y revocar sesión`.
- Paquete canónico: `docs/handoffs/governance/BE-005-context-package.md`, revisión vigente `v16`.
- Preflight canónico: `docs/handoffs/security/BE-005-security-preflight.md`, «Revalidación v16 — integridad F14-01 y remediación F14-02», `ADVISORY`.
- Candidato revalidado antes de la entrega: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; `git diff HEAD | git hash-object --stdin` = `524f08838e6f2b4f8719bdd0bbf67309156082bd`.
- Alcance exclusivo: integridad del manifiesto F14-01 y remediación F14-02, incluidos `SEC-BE005-04`, `05`, `06`, `09` y `11`. No se releyeron HU, contratos ni ADR; no se modificó código, contrato ni migración.

### Implementación, migración y evidencia

- F14-01: el manifiesto de 31 rutas del paquete v16 fue recalculado por ruta, estado Git y SHA-256. Resultado: 31/31 válidas y hash global `F4550469865912C84F2A85492D664E601AEEE5CA15FE301CF560D11BFC2B91D0`.
- F14-02: `JdbcRefreshSessionAdapter.consumeRevocationTicket` bloquea todas las coincidencias del digest y actualiza/retorna sólo la asociación de cardinalidad exactamente uno. `V12__enforce_unique_session_revocation_ticket_digest.sql` impone la unicidad parcial global para digest no nulo, incluso entre tenants.
- `RevocationTicketIntegrityIntegrationTest` cubre tanto el rechazo de duplicado por V12 sin alterar la primera familia como el esquema legado V11 con duplicado, que se rechaza fail-closed sin consumir digest, revocar familia ni auditar.
- Se reutiliza evidencia Maven ya registrada para la misma huella exacta: `RevocationTicketIntegrityIntegrationTest,RefreshSessionTransactionIntegrationTest` PASS, 14 pruebas; `LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest` PASS, 19 pruebas. No se repitió Maven: no hubo cambio funcional desde esa evidencia y la revalidación v16 la vincula ahora mediante F14-01.

### Matriz de controles afectados

| Control | Implementación y prueba vinculada | Estado |
|---|---|---|
| `SEC-BE005-04` | V12 y consumo de cardinalidad única; integración de duplicado V12/V11 y regresión de rollback de logout MOBILE. | Completo |
| `SEC-BE005-05` | Bloqueo `FOR UPDATE` de coincidencias y cardinalidad única; carrera MOBILE de `RefreshSessionTransactionIntegrationTest` más rechazo de ambigüedad V11. | Completo |
| `SEC-BE005-06` | El digest se limpia sólo tras resolución inequívoca; replay no entrega familia ni repite efecto/auditoría. | Completo |
| `SEC-BE005-09` | Sólo el ganador llega a `LOGGED_OUT`; el caso legado ambiguo deja `audit_entry` vacío y las pruebas de rollback conservan atomicidad. | Completo |
| `SEC-BE005-11` | V12 evita colisión cross-tenant y el caso legado preserva ambas familias/tenants sin mutación. | Completo |

### Verificación y reproducción

- `git diff --check HEAD` — PASS.
- Revalidación de identidad posterior a la inspección: `HEAD`, staging, object ID del diff y manifiesto permanecen en los valores v16 anteriores.
- Para reproducir la evidencia dirigida ya vinculada: desde `backend/followupbussiness`, ejecutar `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RevocationTicketIntegrityIntegrationTest,RefreshSessionTransactionIntegrationTest" test`; y `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`.

### Riesgo residual y siguiente límite

- Riesgo residual entregado a validación independiente: comportamiento de la restricción V12 sobre datos productivos preexistentes y verificación independiente de concurrencia/rollback bajo el entorno objetivo.
- No se invocó QA, Seguridad final ni DoF. Este estado sólo habilita el handoff de Desarrollo sobre el candidato v16; no equivale a aprobación de fases posteriores.

## Revalidación por remediación de CI — retención de auditoría (2026-08-05)

### Estado de gate

`BLOCKED` — la corrección está sólo en el worktree y requiere que el Orquestador la incluya en un commit y fije un nuevo candidato antes de cualquier fase posterior.

### Identidad, alcance y causa

- Identidad provisional: `HEAD dd8c14b` + diff acotado `ab9bea641c3cc5009c031e3eb5c29b068a667c41` en `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java`; el diff requiere commit.
- Alcance exclusivo: estabilizar la prueba de integración de retención `retentionKeepsCutoffAndPurgesNetworkBeforeEntriesInBoundedBatches`; no se modificaron implementación productiva, contratos, ADR ni migraciones.
- Causa reproducida: las funciones protegidas de `V9__secure_audit_privileges.sql` evalúan la expiración con `CURRENT_TIMESTAMP`, mientras la prueba fijaba `2026-08-04T12:00:00Z`. Al ejecutarse CI después de ese instante, el registro supuesto de corte (364 días) podía superar los 365 días y la purga devolvía 2 entradas en lugar de 1.
- Corrección: la prueba toma el instante de referencia mediante `SELECT CURRENT_TIMESTAMP` del mismo PostgreSQL que ejecuta la purga; mantiene las fronteras de 91/366/364 días, los lotes y la comprobación de segunda purga idempotente.

### Control afectado y evidencia

- `SEC-BE005-10` afectado: retención de evidencia de auditoría. La corrección verifica que se conserva el registro dentro de la ventana y que se purga primero el contexto de red vencido sin depender del reloj del runner.
- Reproducción previa: `mvn -Dtest=AuditEntryMigrationTest#retentionKeepsCutoffAndPurgesNetworkBeforeEntriesInBoundedBatches test` — FAIL reproducido, 1 prueba, aserción de entradas eliminadas: esperado 1, recibido 2.
- Verificación posterior: el mismo comando — PASS, 1 prueba, 0 fallos/errores; Testcontainers PostgreSQL/PostGIS y Flyway V1–V12 aplicados.
- Riesgo residual: no se reejecutó la suite completa de auditoría porque el cambio es únicamente de determinismo temporal en una prueba dirigida; debe revalidarse contra el candidato que fije el Orquestador.

## Revalidación v17 — retención de auditoría (2026-08-05)

### Estado

`READY_FOR_HANDOFF`

### Identidad, entradas y remediación

- HU: `BE-005 — Cerrar y revocar sesión`; paquete canónico v17; preflight v17 `ADVISORY` en el informe canónico de Seguridad.
- Candidato revalidado: `a40a44735715b7557c3e57671351dd6b6ef97ed7`; staging vacío antes de la documentación de fase.
- La sección anterior de worktree queda sustituida para este candidato: la solución definitiva no sincroniza la prueba con el reloj del servidor. V13 hace que `JdbcAuditEntryStore` transmita `before` y `batchSize`; las funciones protegidas validan corte no futuro y lote `1..500`, preservando `FOR UPDATE SKIP LOCKED`, `SECURITY DEFINER` y los permisos de `audit_purger`.
- Sólo se afectaron `SEC-BE005-10` y la dependencia de integridad de `SEC-BE005-09`; no hay cambio de interfaz pública, sesión, tenant, JWT ni contrato.

### Matriz y evidencia

| Control | Implementación | Prueba / resultado |
|---|---|---|
| `SEC-BE005-10` | Adaptador parametrizado y V13 con corte/lote validados bajo función de purga protegida. | `AuditEntryMigrationTest` PASS, 5 pruebas, Flyway V1–V13: borde 365/90, orden red→entrada, idempotencia y roles. |
| `SEC-BE005-09` | Las funciones mantienen append-only y borrado exclusivo vía `audit_purger`; ningún endpoint de logout se altera. | Suite backend completa PASS: 233 pruebas, 0 fallos, 0 errores, 5 omitidas. |

### Verificación y handoff

- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=AuditEntryMigrationTest" test` con Docker local: PASS, 5/0.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" test` con Docker local: PASS, 233/0; la ejecución superó el límite interactivo, y los XML de Surefire verifican `failures=0`, `errors=0`, `skipped=5`.
- `git diff --check`: PASS antes de fijar el commit; la prueba de integración sandbox no tenía acceso al socket Docker y se repitió con autorización.

No quedan controles aplicables sin implementación, prueba o evidencia para este delta. Se entrega a QA independiente sobre el mismo candidato; este estado no equivale a `PASS` de QA ni a Seguridad final.

## Revalidación v19 — evidencia QA de retención (2026-08-05)

### Estado

`READY_FOR_HANDOFF`

- Paquete v19 y preflight v19 `ADVISORY` verificados; candidato exacto `c0ddb1768bb785c0f027701848cf3ff58dfeb056`; staging vacío.
- `AuditEntryMigrationTest` añade evidencia para los hallazgos v17 sin cambiar producción: cortes futuro/`NULL`; lotes `NULL`/0/1/500/501; firmas de purga permitidas sólo a `audit_purger`; migración V12→V13 con datos; dos purgadores concurrentes suman exactamente 501 y dejan cero filas.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=AuditEntryMigrationTest" test` con Docker local: PASS, 10 pruebas, 0 fallos/errores. `git diff --check` PASS previo al commit.

La matriz afectada `SEC-BE005-10` queda con implementación, prueba y evidencia; `SEC-BE005-09` permanece sin regresión. Se habilita QA independiente v19, no Seguridad final ni DoF.

## Revalidación v20 — SQLState de guardias

`READY_FOR_HANDOFF` — paquete/preflight v20, candidato `294a0e09473fba68ce88dcaaddd1d29fcc47bab0`, staging vacío. La única variación exige `P0001` para las cinco guardias V13 y `42501` para las cuatro firmas denegadas a `PUBLIC`/`audit_writer`. `AuditEntryMigrationTest` PASS 10/0 con Docker; no cambia producción. Habilita QA v20.

## Revalidación v17 — remediación de hallazgos QA de retención (2026-08-05)

### Estado

`READY_FOR_HANDOFF`

### Alcance y archivos

- Remediación limitada de `SEC-BE005-10` tras QA v17: evidencia de corte futuro y `NULL`; lotes `NULL`/`0`/`1`/`500`/`501`; mínimo privilegio de firmas heredadas y V13; upgrade V12→V13 con datos de entrada y contexto de red; y carrera de dos purgadores.
- Modificado únicamente: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java`.
- No se modificaron `JdbcAuditEntryStore`, V13, endpoints, contratos, ADR, sesión, tenant ni otros módulos. V13 sigue siendo la migración aplicable: `backend/followupbussiness/src/main/resources/db/migration/V13__parameterize_audit_retention_purge.sql`.

### Evidencia y criterios cubiertos

- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=AuditEntryMigrationTest" test` con Docker local autorizado: `BUILD SUCCESS`, 10 pruebas, 0 fallos y 0 errores; Testcontainers PostgreSQL/PostGIS y Flyway V1–V13.
- Negativos separados: V13 rechaza corte futuro y nulo; también lote nulo, `0` y `501`. Lotes `1` y `500` eliminan exactamente `1` y `500` registros, con repetición idempotente.
- Privilegios: `PUBLIC` y `audit_writer` no ejecutan ninguna firma heredada ni parametrizada de purga; `audit_purger` ejecuta las cuatro firmas. Se conserva la denegación de `DELETE` directo.
- Upgrade V12→V13: se conservan datos existentes de `audit_entry` y `audit_network_context`, y ambas funciones V13 los purgan con parámetros.
- Concurrencia: dos purgadores sobre 501 entradas expiradas devuelven un total de 501 y dejan la tabla vacía; no hay doble eliminación ni doble conteo.

### Riesgo y reproducción

- Riesgo residual operativo: la disponibilidad de Docker/PostgreSQL fuera de pruebas; no se amplió la suite porque el delta es exclusivamente evidencia de integración de retención.
- Reproducción: ejecutar el comando Maven anterior desde `backend/followupbussiness` con Docker disponible. `git diff --check` también pasa en el worktree actual.

Esta salida habilita solamente la revalidación QA sobre el candidato que fije Orquestación incluyendo esta evidencia; no equivale a `PASS` de QA, Seguridad final ni DoF.

## Remediación v20 — tipado SQLState de guardas V13 (2026-08-05)

### Estado

`BLOCKED` — la remediación está sólo en el worktree; Orquestación debe incluirla en un nuevo commit y fijar el candidato antes de reabrir QA.

### Alcance, contratos y migraciones

- Se modificó exclusivamente `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java`.
- `SEC-BE005-10`: las cinco negativas de parámetros ahora encuentran la `SQLException` causal y afirman `SQLState P0001`, que corresponde al `RAISE EXCEPTION` sin `ERRCODE` explícito de las guardas V13.
- Para cada firma heredada y parametrizada, tanto `PUBLIC` como `audit_writer` afirman `SQLState 42501`; `audit_purger` continúa cubierto como permitido.
- No se modificaron contratos, producción ni migraciones. Sigue aplicando `backend/followupbussiness/src/main/resources/db/migration/V13__parameterize_audit_retention_purge.sql`.

### Evidencia y reproducción

- Desde `backend/followupbussiness`: `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=AuditEntryMigrationTest" test` con Docker local autorizado: `BUILD SUCCESS`, 10 pruebas, 0 fallos, 0 errores; Testcontainers PostgreSQL/PostGIS y Flyway V1–V13.
- Primer intento en sandbox: no ejecutable por acceso denegado a `\\.\\pipe\\docker_engine`; la repetición autorizada anterior aporta la evidencia válida.
- `git diff --check`: PASS. Reproducción: ejecutar el comando Maven anterior con Docker disponible.

### Riesgo residual

- No se repitió la suite completa: el delta sólo endurece aserciones de la prueba de integración ya dirigida y satisfactoria. La disponibilidad de Docker sigue siendo prerequisito operativo de esta verificación.
