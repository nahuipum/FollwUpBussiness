# Paquete de Contexto de Historia — BE-005 — revisión vigente v16

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-005-cerrar-y-revocar-sesion.md` — SHA-256 `15CEB71F0DD904F3A0CCC1038E4C9466D7D5B056F6D8DB92BD0AD7E803D6D7FF` |
| Commit o diff candidato | `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; SHA-1 de `git diff HEAD`: `524f08838e6f2b4f8719bdd0bbf67309156082bd` |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios normalizados

| ID | Criterio verificable | Fuente y sección | Hash de fuente |
|---|---|---|---|
| CA-01 | Un cierre de sesión revoca la familia de sesión correspondiente de forma idempotente y bloquea su reutilización. | BE-005, «Criterios» 1; ADR-008, «Logout, bloqueo y revocación» | `15CE…D7FF`; `2654…0DEC` |
| CA-02 | El bloqueo/inactivación de la cuenta invalida inmediatamente las familias alcanzadas; un access de familia/cuenta no activa queda rechazado. | BE-005, «Criterios» 2; RF-AUT-005; ADR-008, «Logout, bloqueo y revocación» | `15CE…D7FF`; `6297…6B2`; `2654…0DEC` |
| CA-03 | La revocación y sus consultas no afectan ni revelan datos de otro tenant; tenant, identidad y rol se derivan de la sesión/persistencia. | BE-005, «Criterios» 3 y «Seguridad y privacidad»; ADR-008, «Persistencia, cache y aislamiento multiempresa» | `15CE…D7FF`; `2654…0DEC` |
| CA-04 | Logout actual/global, éxito/error y contexto técnico permitido quedan auditados y observables sin secretos ni datos personales completos. | BE-005, «Criterios» 4 y «Observabilidad»; ADR-008, «Auditoría y observabilidad» | `15CE…D7FF`; `2654…0DEC` |

## Reglas y decisiones aplicables

| ID | Regla o decisión | Fuente y sección | Aplicación esperada |
|---|---|---|---|
| R-01 | `POST /auth/logout` normal: access vigente; `allSessions=false` revoca `sid`; `true` solo todas las familias de la cuenta y tenant autenticados. WEB normal exige CSRF. | ADR-008, «Logout, bloqueo y revocación» | Identidad, cuenta, tenant, rol y familia se derivan del JWT/persistencia; ningún parámetro del cliente amplía alcance. |
| R-02 | WEB pendiente solo usa cookie HttpOnly + `X-Logout-Intent:PENDING` + Origin exacto admitido; no acepta `allSessions=true`, no rota ni emite credenciales y responde 204. | ADR-008, «Logout…» y «CSRF y CORS» | Validar forma mutuamente excluyente; borrar cookie con `Max-Age=0`; errores neutros. |
| R-03 | MOBILE pendiente usa exclusivamente ticket HMAC de un uso asociado a una familia; no permite cookie/access/`allSessions`; revoca solo la propia familia e invalida vinculaciones mobile por puerto público. | ADR-008, «Logout…» y OpenAPI `/auth/logout` | Ticket no es autenticación ni autorización; no se propaga como dato a otros dominios. |
| R-04 | PostgreSQL decide sesión activa en cada aceptación de access. Revocación confirma PostgreSQL antes del tombstone Redis; Redis caído/stale nunca reactiva. | ADR-008, «Logout…» y «Persistencia…» | Revocación inmediata de access/refresh; manejo durable de fallo de cache, sin dependencia positiva de Redis. |
| R-05 | Carrera refresh/logout: transición transaccional, una sola ganadora; tras revocación no se emite/acepta refresh sucesor. | ADR-008, «Refresh token, familia y rotación» y «Logout…» | Prueba de carrera reproducible y decisión consistente; no revelar sucesores. |
| R-06 | Logout global aplica 5/h por cuenta solo para deduplicar/alertar/backoff: nunca 429, nunca niega, retrasa ni omite la revocación. | ADR-008, «Rate limiting y abuso» | Control de abuso sin identidad en claro; logout sigue idempotente si Redis no está disponible. |
| R-07 | Errores usan `application/problem+json`, `correlationId`, `Cache-Control:no-store` y detalle no sensible. | ADR-008, «Política de errores HTTP» | No filtrar estado de sesión/cuenta/tenant ni token/cookie/CSRF/digest. |
| R-08 | Auditoría solo con campos técnicos permitidos; no JWT, refresh, ticket, CSRF, `Authorization`, digest ni payload completo. Retención de auditoría: entradas 365 días; contexto de red 90; logs/métricas saneados 30. | ADR-008, «Auditoría…»; ADR-020 D1/D3 | Usar puerto público `audit`; mantener minimización y política vigente, sin inventar retención. |
| R-09 | Logout detiene rastreo y el contexto revocado no puede reconectar/suscribirse. | RN-020/RF-UBI-008; `docs/events/websocket-contract.md` «Suscripciones / reautorización» | Sólo integrar superficies que ya existan en Backend; documentar cualquier dependencia no implementada. |
| R-10 | Arquitectura hexagonal, PostgreSQL fuente de verdad, consultas y claves multiempresa con tenant validado; observabilidad con correlationId, tenant seguro, userId técnico, operación, resultado y latencia. | `backend/.../AGENTS.MD`; `shared/ENGINEERING_RULES.md` §7 | No exponer entidades ni cruzar tablas internas de otros dominios. |

## Contratos y artefactos afectados

| Tipo | Ruta y sección/símbolo | Cambio esperado | Consumidores |
|---|---|---|---|
| HTTP | `docs/api/openapi.yaml` `/auth/logout`, `LogoutRequest`, headers `X-CSRF-Token`, `X-Logout-Intent`, `X-Session-Revocation-Ticket` | Implementar exactamente sus tres modalidades y 204 idempotente; actualizar contrato solo si se descubre inconsistencia. | WEB, MOBILE, QA contrato |
| Seguridad | `identityaccess` `SecurityConfiguration`, `InboundJwtAuthenticator` | El endpoint conserva autorización y el access valida familia/cuenta/tenant/rol persistidos. | REST/API |
| Sesiones | `identityaccess` `RefreshSession*`, `JdbcRefreshSessionAdapter`, migraciones V5/V10 | Puerto/caso de uso/adaptador de revocación coherente con refresh y transacciones. | Login, refresh, filtros JWT |
| Auditoría | `audit` puerto público `RecordAuthenticationAudit*` | Evento de logout sin datos sensibles; política ADR-020 aplicable. | Auditoría/operación |
| Presencia/notificaciones | Contrato OpenAPI y ADR-008; no hay contrato Backend de presencia incluido | Revocar vinculaciones MOBILE solo por puerto público si el módulo ya lo ofrece; no acoplarse a tablas ajenas. | Mobile/notificaciones |

## Alcance y riesgos

| Elemento | Clasificación | Evidencia |
|---|---|---|
| Endpoint y revocación actual/global | Dentro | BE-005; OpenAPI `/auth/logout`; ADR-008 |
| Invalidación access/refresh y carrera refresh/logout | Dentro | ADR-008 R-04/R-05 |
| Tenant, recurso, roles, CSRF/canal | Dentro | BE-005; ADR-008; OpenAPI |
| Auditoría, métricas, logs y retención vigente | Dentro | BE-005; ADR-008; ADR-020 |
| Detención de rastreo/WS y enlaces mobile | Dependencia transversal | RF-UBI-008, contratos sync/WS; no extender backend fuera del puerto público existente sin registrar excepción. |
| Registro público, roles arbitrarios, autenticación social | Fuera | BE-005 «Fuera de alcance» |
| Riesgos | Alto | Sesión robada/replay, escalación `allSessions`, cruce de tenant, CSRF/origen, Redis degradado, carrera refresh/logout, fuga en auditoría/logs, revocación sin retención. |

## Preflight de Seguridad

| Resultado | Revisión | Ruta de evidencia |
|---|---|---|
| `ADVISORY` | Emitido antes de Desarrollo; no aprueba código | `docs/handoffs/security/BE-005-security-preflight.md` |

| Control | Amenaza o riesgo | Implementación exigida | Prueba obligatoria | Aplica |
|---|---|---|---|---|
| SEC-BE005-01 | Suplantación/manipulación de identidad, tenant o rol | Derivar actor, `sid`, cuenta y tenant de JWT firmado y fila persistida; rechazar claims/estado inválidos. | JWT alterado, familia/cuenta/empresa revocada o inactiva y `tid` cruzado no llegan al caso de uso. | Sí |
| SEC-BE005-02 | Revocar sesión ajena o escalar a global | Normal actual solo `sid`; global solo cuenta+tenant autenticados y rol autorizado; sin ids de objetivo cliente. | Actual, global y objetivo ajeno/cross-tenant; verificar familias exactas. | Sí |
| SEC-BE005-03 | CSRF/canal/origen y downgrade WEB/MOBILE | Tres modalidades mutuamente excluyentes; CSRF WEB, Origin allowlist y cookie/ticket según contrato. | WEB normal/pending y MOBILE pending; combinaciones prohibidas 400/401/403 sin revocar ajeno. | Sí |
| SEC-BE005-04 | Reutilización de refresh/access tras logout | Revocar en PostgreSQL y verificar familia por solicitud; cache solo tombstone, nunca estado positivo. | Refresh y access post-logout se rechazan inmediatamente; Redis fallo/stale no reactiva. | Sí |
| SEC-BE005-05 | Carrera refresh/logout | Serialización/transacción que impide emitir/aceptar sucesor tras revocación. | Carrera controlada refresh/logout; estado final revocado y ningún token reutilizable. | Sí |
| SEC-BE005-06 | Replay/reintentos y fuga de estado | 204 idempotente para familia ya revocada; pending restringido a propia familia. | Repetición normal, WEB pending y MOBILE ticket: mismo resultado, sin credenciales/identidad. | Sí |
| SEC-BE005-07 | Abuso y denegación de revocación | Rate limit global para dedupe/alerta sin bloquear/logout; Redis no disponible aún procesa. | Exceso y limitador caído: 204/revocación, sin 429/503 que omita la operación. | Sí |
| SEC-BE005-08 | Fuga de secretos/enum. por error | Problem neutral/no-store/correlation y logs sin credenciales, PII, digest o payload. | Errores de forma/CSRF/ticket/JWT; inspección de respuesta y logging/audit. | Sí |
| SEC-BE005-09 | Acción no auditada o datos excesivos | Auditoría por puerto público con campos mínimos, resultado y correlation; sin secretos. | Éxito, global y fallo/denegación producen evento saneado o justifican indisponibilidad de puerto. | Sí |
| SEC-BE005-10 | Retención indebida de auditoría | Reutilizar modelo/retención ADR-020: append-only, 365/90/30; no crear datos prohibidos. | Prueba/inspección del evento y configuración/migración de retención afectada. | Sí |
| SEC-BE005-11 | Persistencia/cache sin aislamiento tenant | Predicados por familia/cuenta/tenant derivado; claves cache con namespace tenant y no datos positivos. | Dos tenants con UUID/familia distintos; operación no cruza ni revela filas/cache. | Sí |
| SEC-BE005-12 | Autorización por recurso y presencia residual | Aplicar rol/contexto persistido; invocar sólo puerto público de presencia/notificaciones disponible. | Sin permiso, rol/tenant incorrecto y revocación de ámbito: no efecto lateral no autorizado. | Sí |

## Plan de fases

| Fase | Entrada mínima | Salida requerida | Gate |
|---|---|---|---|
| Preflight Seguridad | Este paquete, candidato | `ADVISORY` + matriz `SEC-*` | Controles verificables, no aprobación |
| Desarrollo | Paquete v1 + preflight | Handoff `READY_FOR_HANDOFF` | Implementación y prueba de todo `SEC-*` aplicable |
| QA | Paquete + preflight + handoff Dev + candidato | `PASS`/`CHANGES_REQUIRED`/`BLOCKED` | Matriz criterio → prueba independiente |
| Seguridad | Paquete + Dev + QA + candidato | `PASS`/otro estado | Riesgo según diff y controles completos |
| DoF | Paquete + todos los handoffs + candidato + PR/CI | `PASS`/`BLOCKED` | Misma versión candidata; commit, PR y CI exigidos |

## Regla de excepción

No releer una fuente primaria ya listada. Si es indispensable, registrar en el handoff el motivo, la ruta, la sección, el hash y el resultado. Un cambio de hash invalida este paquete y requiere una nueva versión del Orquestador.

## Ruta de remediación

Un hallazgo de Seguridad no reinicia la HU. Crear una nueva versión del paquete solo para el candidato y controles afectados, y recorrer `Dev de remediación → QA afectado → Seguridad final → DoF`. Reutilizar evidencia inmutable de controles no afectados y documentar la decisión.

## Revisión v13 — reanudación por H-03 (2026-08-05)

### Identidad, causa y alcance invalidado

- Candidato fijado: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `fe5e66df0b2cc27c9fd25d2065c2b094640a5cbd`; staging `vacío`.
- Causa: remediación del hallazgo H-03 mediante consumo atómico de ticket MOBILE de revocación. La evidencia histórica es `docs/handoffs/backend/BE-005-remediation-v13-candidate.md`, SHA-256 `FCDF5493712AE8494E0E3B34C277A19BE0F758C9E6B109C6F9D8349E9ECCD1B1`; es sólo evidencia histórica, no un handoff canónico ni autoriza fases.
- Delta funcional declarado: `consumeRevocationTicket` realiza un único `UPDATE ... RETURNING` condicionado a digest presente, familia no revocada, no vencida y canal `MOBILE`; limpia el digest y entrega la familia sólo si lo consumió. El replay se rechaza sin una segunda auditoría `LOGGED_OUT`. Consumo, revocación, instalaciones y auditoría permanecen en la transacción de `LoginConfiguration`; un fallo posterior revierte también el consumo.
- Superficies H-03: `RefreshSessionPort`, `JdbcRefreshSessionAdapter`, `LogoutSessionService`, `LogoutSessionServiceTest` y `RefreshSessionTransactionIntegrationTest`. No hay cambio de contrato externo ni migración declarado.
- Alcance invalidado: todos los gates y estados de Desarrollo/QA/Seguridad/DoF que dependían de cualquier diff anterior quedan invalidados para esta identidad. En particular, los estados históricos `READY_FOR_HANDOFF`, `PASS` y `ADVISORY` no se reutilizan.

### Evidencia disponible y reutilizable

| Evidencia | Resultado | Uso en v13 |
|---|---|---|
| `mvn clean "-Dtest=LogoutSessionServiceTest" test` | PASS, 8 pruebas | Evidencia dirigida H-03; se entrega a Desarrollo tras preflight, no habilita QA. |
| `mvn "-Dtest=RefreshSessionTransactionIntegrationTest" test` | PASS, 9 pruebas; Testcontainers PostgreSQL/PostGIS y Flyway hasta V11 | Evidencia dirigida H-03 de consumo, vencimiento y rollback; se entrega a Desarrollo tras preflight. |
| `git diff --check` | PASS | Integridad de diff reutilizable mientras permanezca la huella fijada. |
| `graphify update .` | PASS | Grafo actualizado; no es aprobación de fase. |
| Criterios, reglas R-01..R-10 y matriz SEC-BE005-01..12 de este paquete | Fuentes sin nueva contradicción reportada | Reutilizables como requisitos, no como resultado de verificación ni autorización. |

### Registro de gates

| Fecha | Gate | Identidad verificada | Estado | Decisión / faltante |
|---|---|---|---|---|
| 2026-08-05 | Preflight de Seguridad anterior | Diff distinto de `fe5e66…b094` | `INVALIDATED` | Su `ADVISORY` pertenece a otro candidato; no se reutiliza. |
| 2026-08-05 | Desarrollo anterior | Diff distinto de `fe5e66…b094` | `INVALIDATED` | Sus estados y evidencias de cobertura no autorizan QA para v13. |
| 2026-08-05 | QA / Seguridad final / DoF anteriores | Diff distinto de `fe5e66…b094` | `INVALIDATED` | No se pueden iniciar ni reutilizar; faltan preflight v13 y los handoffs posteriores de la misma identidad. |
| 2026-08-05 | Siguiente gate permitido | `HEAD 3a787…cda7` + `fe5e66…b094` | `PENDING` | Invocar exclusivamente Preflight de Seguridad v13; no autoriza Desarrollo, QA, Seguridad final ni DoF. |

## Revisión v14 — cierre de evidencia H-03 (2026-08-05)

### Identidad y delta

- Candidato fijado: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `b5ddac5b7fd730a248cca12e293984daf69e540f`; staging `vacío`.
- Causa: se añadieron pruebas de la conducta H-03, sin cambiar código productivo, contrato ni migración. Archivos de pruebas afectados: `RefreshSessionTransactionIntegrationTest`, `LogoutSessionServiceTest` y `LogoutControllerTest`.
- El delta demuestra: rechazo sin mutación de ticket ligado a `WEB`; rollback completo de digest/revocación/auditoría tras fallos de instalaciones o auditoría; único ganador bajo dos consumos MOBILE concurrentes; replay sin segundo efecto; aislamiento del tenant ajeno; y error HTTP neutral que no refleja el ticket.

### Evidencia revalidada

| Comando | Resultado | Cobertura H-03 |
|---|---|---|
| `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` | PASS, 19 pruebas | Replay/puerto, respuesta neutral y límites hexagonales. |
| `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RefreshSessionTransactionIntegrationTest" test` | PASS, 12 pruebas, Testcontainers PostgreSQL/PostGIS y Flyway V1–V11 | Canal WEB, rollback posterior, concurrencia de ticket, auditoría e aislamiento tenant. |
| `git diff --check` y `graphify update .` | PASS | Integridad de diff y grafo actualizado. |

### Invalidez y Registro de gates

| Fecha | Gate | Identidad | Estado | Decisión |
|---|---|---|---|---|
| 2026-08-05 | Preflight v13 y handoff Dev v13 | Diff anterior `fe5e66…b094` | `INVALIDATED` | Sus estados no se reutilizan: la huella cambió al añadir pruebas. |
| 2026-08-05 | Siguiente gate permitido | `HEAD 3a787…cda7` + `b5ddac…540f` | `PENDING` | Solicitar exclusivamente Preflight de Seguridad v14 para esta evidencia; QA, Seguridad final y DoF permanecen cerrados. |

## Revisión v15 — remediación acotada F14-02 (2026-08-05)

### Identidad y alcance

- `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; diff tracked `524f08838e6f2b4f8719bdd0bbf67309156082bd`.
- Se corrige exclusivamente `F14-02`, que afectaba `SEC-BE005-04,05,06,09,11`: V12 impone unicidad parcial de `revocation_ticket_digest` no nulo, y `consumeRevocationTicket` bloquea las filas coincidentes y sólo limpia/retorna una familia si la cardinalidad es exactamente una.
- Archivos de la remediación: `JdbcRefreshSessionAdapter.java` SHA-256 `F69638532BD6CB70382D00FFF703B68480DA61EFBE626BB10BA8CC89BF6181B8`; `V12__enforce_unique_session_revocation_ticket_digest.sql` SHA-256 `EB3F9E188889EB9CDD74F13BF8FE620BB28B036E900ED522265476088F633195`; `RevocationTicketIntegrityIntegrationTest.java` SHA-256 `EC82C5C0B45C3E02FA9523C6C1B8EF2A2B0321E77FA327EBA553EDBEB2C213CE`.
- No se modifica contrato externo ni límite arquitectónico; V12 es una restricción de integridad de la persistencia existente y no requiere ADR.

### Evidencia nueva

| Comando | Resultado | Cobertura |
|---|---|---|
| `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RevocationTicketIntegrityIntegrationTest,RefreshSessionTransactionIntegrationTest" test` | PASS, 14 pruebas | V12 rechaza digest igual entre tenants sin mutar la primera familia; con esquema legado V11, dos digest iguales producen rechazo neutral, cero mutaciones y cero auditorías; se conserva regresión H-03. |
| `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` | PASS, 19 pruebas | Servicio, HTTP y límites estructurales. |
| `git diff --check` | PASS | Integridad textual. |

### Registro de gates

| Fecha | Gate | Identidad | Estado | Decisión / faltante |
|---|---|---|---|---|
| 2026-08-05 | Remediación F14-02 | `HEAD 3a787…cda7` + `524f088…82bd` | `EVIDENCED` | Implementación y pruebas dirigidas completas para el hallazgo de unicidad/cardinalidad. |
| 2026-08-05 | Identidad candidata completa (F14-01) | Diff tracked excluye V12, su prueba y otros archivos críticos no versionados | `BLOCKED` | Esta revisión no es un candidato liberable: falta fijar un manifiesto canónico completo ruta/estado/SHA-256 o incluir los archivos en Git. No se reutiliza `READY_FOR_HANDOFF`, `PASS` ni `ADVISORY` de v14. |
| 2026-08-05 | Siguiente gate | Misma identidad v15 | `BLOCKED` | No invocar QA, Seguridad final ni DoF hasta cerrar F14-01 y revalidar explícitamente el candidato resultante. |

### Estado

`BLOCKED` — F14-02 queda remediado con evidencia, pero F14-01 continúa abierto y hace imposible asociar esa evidencia a un candidato inmutable.

## Revisión v16 — manifiesto funcional canónico F14-01 (2026-08-05)

### Identidad candidata completa

- HU: `BE-005 — Cerrar y revocar sesión`.
- `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; SHA-1 de `git diff HEAD`: `524f08838e6f2b4f8719bdd0bbf67309156082bd`.
- El manifiesto cubre todas las 31 rutas funcionales de BE-005 que difieren de `HEAD`, tanto tracked como untracked. Excluye deliberadamente gobierno, plantillas, instrucciones y handoffs; el hash del diff tracked completo detecta su deriva.
- Hash global del manifiesto: `F4550469865912C84F2A85492D664E601AEEE5CA15FE301CF560D11BFC2B91D0`, calculado sobre filas UTF-8 LF ordenadas por ruta, con formato exacto `ruta|estado|SHA-256\n`.

### Manifiesto verificable

| Ruta | Estado | SHA-256 |
|---|---|---|
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/persistence/JdbcAuthenticationAuditAdapter.java` | tracked, unstaged | `A93B3610FF6020FA441B6FB040B4A75A847E7C40B619CBE72E99C204C5960112` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/application/RecordAuthenticationAuditCommand.java` | tracked, unstaged | `4D26A3D175C0282E46E78530D014B26BCB557C8797FBD535D56A338E750E924B` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LogoutController.java` | untracked | `49459420C8428A36F6E47FEB5686A8A6B716C8E9837F681513AC8B19E8003A8E` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticationFilter.java` | tracked, unstaged | `07A265E1D9536F39A2746920DFEF8EC901738B9A008D333572D9D14AE4880219` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticator.java` | tracked, unstaged | `4FBF5CCFEDE3F62290F56E690AC9387C64077BB118E1C8E5929A2F77F55127D6` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/RestAccessDeniedHandler.java` | tracked, unstaged | `E4E0B7094139CB095C0F15C85D0925900636F88FAAE60DB5A421093698B0E62B` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/RestAuthenticationEntryPoint.java` | tracked, unstaged | `2EB9683BC23533E172FCF63407C0A0DC471F0B19C14011F690CA8A55B88B05D0` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/SecurityErrorResponseWriter.java` | tracked, unstaged | `45F7CE3CC599EBEA4B8A6525467D961EB1C8A58C163CA4B788237BA15EA52278` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcRefreshSessionAdapter.java` | tracked, unstaged | `F69638532BD6CB70382D00FFF703B68480DA61EFBE626BB10BA8CC89BF6181B8` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/security/RedisLogoutAbuseMonitor.java` | untracked | `3C5F63CC5511BC051F366037623D72F4F001A9BD8E873FB135298638920246AC` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionService.java` | untracked | `93FC9A1442F8B42920D9B791798388B5FF8F73847F47916FB313803FE987DA40` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/in/LogoutSessionUseCase.java` | untracked | `BF91621E5FBDB8A5ED20FF804CC4EEE87FABF32623B3D3EE3E99657634D7C890` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/out/LogoutAbuseMonitor.java` | untracked | `E380606BCC3B8C50CBFE6D6D43D677F78007630F142280B47A3D06B53C08D3FA` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/out/RefreshSessionPort.java` | tracked, unstaged | `AB9C9DCE7969EAF932C06D1F782FEBE58F9472280AF5FFA66543DF442C6C9F00` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/LoginConfiguration.java` | tracked, unstaged | `6FF50B8971A9C52214920B46FCB0B14F86C8037450EDF9B7207F6EC3B7452306` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfiguration.java` | tracked, unstaged | `0BF6D6009BBE845085A3E1DEDB1B167679B14BDD76B8AC3AF51CABC24C84E842` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/AuthenticatedActor.java` | tracked, unstaged | `D00736FF238B0BC08E29590D1C3DB26AA667BB0912B8E4E3F43756CDE728ED09` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/adapter/out/persistence/JdbcInstallationRevocationAdapter.java` | untracked | `8C9155413665074C5BC2FB5F04070CA80940C6FCF8A6E69A7025712543966688` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/application/port/in/RevokeInstallationsForSession.java` | untracked | `667A17BEC9B9506907AEE03EFD61F559FA256B140266AF7769A2F635710B63D1` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/application/RevokeInstallationsForSessionService.java` | untracked | `FF2D7867EEA1D49C53E0AF279ED1BEF754E6BE4A80FC16488BFF2CF64154C56D` |
| `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/notifications/config/NotificationsConfiguration.java` | untracked | `97BC73B09CC78D338897BD6E103BCAACD8A50AC19CCF1549486A4E9F3CDD836F` |
| `backend/followupbussiness/src/main/resources/db/migration/V11__create_notification_installation_revocations.sql` | untracked | `232A3C9FB191C47F5D2DEB72492B118AB3A8CB71F926B8F009C716826CA410C1` |
| `backend/followupbussiness/src/main/resources/db/migration/V12__enforce_unique_session_revocation_ticket_digest.sql` | untracked | `EB3F9E188889EB9CDD74F13BF8FE620BB28B036E900ED522265476088F633195` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LogoutControllerTest.java` | untracked | `6612685CDFB9EDA4839BAC72CB8456CDECF7459521039B1E89B52638C6467B5E` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/InboundJwtAuthenticatorTest.java` | tracked, unstaged | `93BCBB72391774414BF7CB8B1E10D3347F4726D71801E36C76B1248AA6C0540A` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/out/security/RedisLogoutAbuseMonitorTest.java` | untracked | `9A08ADBD9B12A430CC6F1EB321DB95EC3A5CAD428C368222D752B4EAC740FD15` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/application/LogoutSessionServiceTest.java` | untracked | `E92E9BCA48EA8C439A9D021D27C5CC47C5BC30BB32C02D8E56A20DABE2D9677E` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfigurationTest.java` | tracked, unstaged | `76F5CE7CF42B96905D4EFB4E1C5E7B4C07E819BAA7494A24464154D3D4931E86` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RefreshSessionTransactionIntegrationTest.java` | tracked, unstaged | `5BE052C9D637FA3089A9BE2E8BC2A19456417D6E7DF4E13C38C27BF3CFEAC8E0` |
| `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/RevocationTicketIntegrityIntegrationTest.java` | untracked | `EC82C5C0B45C3E02FA9523C6C1B8EF2A2B0321E77FA327EBA553EDBEB2C213CE` |
| `docs/events/notification-contract.md` | tracked, unstaged | `0494ABEAA03498B1BF8A817086F5A8A0421BF5F68434210C8E9B4B4C7DA66CE5` |

### Invalidez y gate

| Gate | Estado | Decisión |
|---|---|---|
| Preflight, Desarrollo, QA y Seguridad final v14/v15 | `INVALIDATED` | La identidad se fija ahora con manifest completo; sus estados no se reutilizan sin revalidación explícita. |
| F14-01 | `REMEDIATED` | Toda superficie funcional BE-005, incluidos archivos untracked, queda vinculada por el manifiesto verificable. |
| Siguiente gate permitido | `PENDING` | Invocar únicamente Preflight de Seguridad v16; QA, Seguridad final y DoF siguen cerrados. |
