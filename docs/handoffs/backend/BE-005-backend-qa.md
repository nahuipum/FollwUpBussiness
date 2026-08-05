# BE-005 — QA Backend independiente

## Estado

`BLOCKED`

El candidato no puede avanzar a Seguridad/DoF. `SEC-BE005-12` requiere un contrato público de presencia/notificaciones que no existe en el backend, por lo que su implementación no puede inferirse sin ampliar el contrato/ADR. Además, se detectaron incumplimientos reproducibles de idempotencia y auditoría de denegaciones.

## Candidato revisado

- Base: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`.
- SHA-1 del diff tracked al cierre QA: `a587d7bdebced0aa6d5c8d5219f3f0df59fe7adc`.
- Archivos nuevos BE-005 revisados: caso de uso, controlador, puerto de entrada, monitor Redis y sus tres clases de prueba.
- No se releyeron fuentes primarias; se usaron únicamente paquete v1, preflight y handoff Dev. Sin excepciones.

## Matriz resumida

| Criterio/control | Implementación observada | Prueba/evidencia | Resultado |
|---|---|---|---|
| CA-01 | Revocación actual por `sid` derivado y SQL durable. | `LogoutSessionServiceTest`; integración Dev de logout global. | `CHANGES_REQUIRED`: el reintento actual se rechaza. |
| CA-02 | `revokeAll(account, tenant)` con predicados de cuenta/tenant. | Unitarias dirigidas; sin matriz multi-tenant de integración. | Parcial. |
| CA-03 | Actor/sid derivados; resolución por cuenta+tenant; formas pending excluyentes. | `InboundJwtAuthenticatorTest`, `LogoutControllerTest`. | Parcial: falta integración cross-tenant. |
| CA-04 | Evento técnico en logout exitoso por puerto de auditoría. | Unitarias/integración Dev. | `CHANGES_REQUIRED`: no se auditan denegaciones. |
| SEC-BE005-01 | JWT entrega actor con `sid`; resolución durable. | `InboundJwtAuthenticatorTest` (ejecutada). | Parcial. |
| SEC-BE005-02 | Actual por familia autenticada; global por cuenta+tenant. | `LogoutSessionServiceTest` (ejecutada). | Parcial; falta matriz de recursos/roles/tenants. |
| SEC-BE005-03 | Separación normal/WEB pending/MOBILE pending, Origin y CSRF. | `LogoutControllerTest` (ejecutada). | Parcial. |
| SEC-BE005-04 | PostgreSQL revoca durablemente y usa bloqueo de fila. | `RefreshSessionTransactionIntegrationTest` de Dev, 4/0. | Parcial; Redis stale/degradado no ejecutado. |
| SEC-BE005-05 | Transacciones para refresh/logout. | Solo carrera refresh/refresh en evidencia Dev. | `NOT_EXECUTED`: falta carrera refresh/logout en ambos órdenes. |
| SEC-BE005-06 | Reintentos pending/global operan de forma neutral. | Unitarias e integración global. | `CHANGES_REQUIRED`: reintento current no es idempotente. |
| SEC-BE005-07 | Contador Redis HMAC con TTL y fallo no bloqueante. | `RedisLogoutAbuseMonitorTest` (ejecutada). | `CHANGES_REQUIRED`: no materializa la semántica 5/h. |
| SEC-BE005-08 | `problem+json`, correlación, `no-store`. | `LogoutControllerTest` (ejecutada). | Parcial; no matriz JWT/CSRF/ticket inválidos. |
| SEC-BE005-09 | Auditoría de logout exitoso. | Servicio e integración Dev. | `CHANGES_REQUIRED`: denegaciones/fallos no se auditan. |
| SEC-BE005-10 | Sin cambio de retención ni esquema de auditoría. | Sin prueba de retención/evento. | `NOT_EXECUTED`. |
| SEC-BE005-11 | Predicados tenant para actor/global; clave Redis HMAC. | Servicio y monitor Redis (ejecutados). | Parcial; falta prueba de dos tenants. |
| SEC-BE005-12 | No hay puerto público de presencia/notificaciones para desvincular/revocar efectos laterales. | Búsqueda dirigida: ambos módulos contienen solo `package-info.java`. | `BLOCKED`: contrato/ADR requerido. |

## Comandos y evidencia

- `git rev-parse HEAD` → `3a787569ca873f084e0b6f0e052988933935cda7`; SHA-1 tracked arriba; `git diff --check HEAD` correcto.
- Desde `backend/followupbussiness`: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutControllerTest,RedisLogoutAbuseMonitorTest,LogoutSessionServiceTest,RefreshServiceTest,RefreshControllerTest,InboundJwtAuthenticatorTest" test` → `BUILD SUCCESS`, 20 pruebas, 0 fallos/errores.
- Se reutiliza evidencia Dev del mismo candidato para `RefreshSessionTransactionIntegrationTest`: 4 pruebas, 0 fallos/errores con PostgreSQL/Flyway V1–V10. No se repitió Testcontainers porque no aportaba evidencia nueva frente a los huecos identificados.
- `rg` y listado dirigido de `notifications`/`tracking`: solo ocho archivos `package-info.java`; no hay puerto, adaptador ni contrato invocable de presencia/notificaciones.

## Hallazgos

1. **BLOCKER — SEC-BE005-12.** No existe contrato público para desconectar/desvincular dispositivos MOBILE o impedir presencia/rastreo tras revocación. Reproducción: listar los archivos de `notifications` y `tracking`; solo se obtienen `package-info.java`. Se requiere definición de producto/contrato y, si cambia límites entre dominios, ADR antes de implementar un puerto. No crear tablas ni acoplar módulos ajenos como sustituto.
2. **ALTA — CA-01 / SEC-BE005-06.** `LogoutSessionService.logout` lanza `Rejected` en logout actual autenticado cuando `family.revokedAt() != null`; por tanto el segundo cierre current no es neutral/idempotente. Reproducción: resolver una familia WEB/MOBILE ya revocada y llamar dos veces con `allSessions=false`; la segunda llamada entra en la condición `family.revokedAt() != null` y devuelve 401 desde el controlador. Añadir prueba current antes/después de revocar y preservar 204 neutral, sin reemitir credenciales.
3. **ALTA — CA-04 / SEC-BE005-09.** El evento de auditoría se registra solo después de una revocación exitosa. Todas las rutas `Rejected` salen antes de `audit.record`, y el `catch` del controlador solo responde `problem`. Reproducción: CSRF inválido o ticket inexistente; no se invoca el puerto de auditoría. Añadir auditoría técnica mínima de denegación/fallo y prueba que verifique ausencia de secretos.
4. **MEDIA — SEC-BE005-07.** `RedisLogoutAbuseMonitor.record` incrementa una clave con TTL, pero nunca evalúa ni materializa el umbral 5/h para deduplicación/alerta/backoff. Reproducción: invocarlo seis veces para la misma cuenta+tenant; solo hay incrementos y no hay efecto de dedupe/alert/backoff. Definir el efecto no bloqueante acordado y cubrir exceso y Redis caído, sin 429/503 ni reversión de la revocación.

## Regresión relevante y riesgos residuales

- Las 20 pruebas unitarias/web dirigidas ejecutadas pasan; la integración Dev cubre revocación global durable. La regresión de logout actual repetido, las denegaciones auditadas y el límite 5/h no están cubiertos.
- Persisten sin ejecución: matriz HTTP de tres modalidades, Redis stale, carrera refresh/logout, dos tenants y retención de auditoría. Se reportan como `NOT_EXECUTED`/parciales, no como fallos independientes.

---

## QA afectado v2 — 2026-08-04

### Estado

`BLOCKED`

La revalidación afectada no se ejecutó: el candidato entregado no es el que fija el Paquete de Contexto v2. Conforme a la inmutabilidad del paquete, debe emitirse un paquete nuevo con la huella actual y el handoff Dev debe vincular su evidencia a ese candidato antes de repetir pruebas o concluir sobre los controles.

### Integridad y evidencia

- Paquete v2: base `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` y diff tracked `a587d7bdebced0aa6d5c8d5219f3f0df59fe7adc`.
- Candidato observado: mismo `HEAD`, pero diff tracked `e8dcefa3429d97438453a700dbf0161565e504f7`.
- `git diff --check HEAD`: correcto; esta comprobación no resuelve la discrepancia de candidato.
- El handoff Dev reporta 49/49, pero no declara la huella `e8dc…`; por tanto esa ejecución no es evidencia verificable del candidato fijado por v2.
- No se releyeron fuentes primarias. No se ejecutaron Maven/Testcontainers ni se inspeccionaron controles por el bloqueo concluyente de trazabilidad.

### Matriz afectada

| Criterio/control | Estado QA v2 | Evidencia/hueco |
|---|---|---|
| CA-01, CA-04 | `BLOCKED` | Candidato no coincide con el paquete v2. |
| SEC-BE005-01, 03, 04, 05, 06, 07, 09, 11 | `BLOCKED` | No revalidables hasta fijar candidato y asociar pruebas a su huella. |
| SEC-BE005-12 | `BLOCKED` | Se mantiene decisión externa: falta contrato público de presencia/notificaciones; requiere Producto/Arquitectura y ADR si cambia límites. |

### Hallazgo y reproducción

1. **BLOCKER — trazabilidad de candidato.** Reproducción: ejecutar `git diff HEAD | git hash-object --stdin`; devuelve `e8dcefa3429d97438453a700dbf0161565e504f7`, distinto de `a587d7bdebced0aa6d5c8d5219f3f0df59fe7adc` declarado por `BE-005-context-package-v2-remediation.md`. Remediación requerida: Orquestación debe generar paquete de contexto v3 (o corregir el v2 antes de reanudar), con SHA actual, archivos nuevos incluidos y evidencia Dev 49/49 vinculada explícitamente a esa huella.

### Riesgo residual

Hasta fijar el candidato siguen sin una conclusión QA independiente los controles de autenticación normal/pending, revocación/auditoría durable, carrera refresh/logout, límite global, aislamiento tenant y Redis stale. SEC-BE005-12 permanece bloqueado por contrato externo.

---

## QA afectado v3 — 2026-08-04

### Estado

`BLOCKED`

La huella del candidato coincide con el Paquete v3, y la evidencia reproducible confirma las partes remediadas. No puede avanzar: SEC-BE005-12 sigue bloqueado por contrato externo y SEC-BE005-05/09 no alcanzan su evidencia/implementación obligatoria. SEC-BE005-07 también conserva una discrepancia funcional.

### Candidato y comandos

- Base: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; diff tracked: `e8dcefa3429d97438453a700dbf0161565e504f7`, coincidente con `BE-005-context-package-v3-remediation.md`; `git diff --check HEAD` correcto.
- `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=SecurityConfigurationTest,LogoutControllerTest,LogoutSessionServiceTest,RedisLogoutAbuseMonitorTest,RefreshSessionTransactionIntegrationTest,InboundJwtAuthenticatorTest" test`: las cinco clases sin contenedor pasaron (44 pruebas); el intento sandbox no pudo acceder a Docker.
- Repetición elevada limitada: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=RefreshSessionTransactionIntegrationTest" test` → `BUILD SUCCESS`, 4 pruebas, 0 fallos/errores, PostgreSQL efímero y Flyway V1–V10.
- Total reproducido por la selección actual: 48 pruebas, 0 fallos/errores. El `49/49` del handoff Dev no concuerda con los conteos Surefire actuales (29+3+5+1+6+4); no se trata como fallo funcional, pero debe corregirse como evidencia.

### Matriz afectada

| Criterio/control | Implementación/prueba | Resultado QA v3 |
|---|---|---|
| CA-01 / SEC-06 | El servicio ya no rechaza `revokedAt`; `revoke` es durable/idempotente. Unitarias e integración global pasan. | Parcial: falta prueba explícita del reintento current tras respuesta perdida. |
| CA-04 / SEC-09 | Auditoría de éxito es saneada y su indisponibilidad no revierte el UPDATE. | `CHANGES_REQUIRED`: `Rejected` ocurre antes de `audit.record`; no hay auditoría de denegación/fallo ni prueba correspondiente. |
| SEC-01 / SEC-03 | Configuración/seguridad y controladores dirigidos pasan. | Parcial: las pruebas de `LogoutControllerTest` siguen siendo standalone; la evidencia de cadena real está en `SecurityConfigurationTest`. |
| SEC-04 | Auditoría no revierte la revocación; integración durable 4/4 pasa. | Parcial: Redis stale no positivo no tiene prueba. |
| SEC-05 | Solo existe carrera refresh/refresh; ninguna prueba inicia refresh y logout en ambos órdenes. | `CHANGES_REQUIRED`: prueba obligatoria ausente. |
| SEC-07 | Monitor usa clave HMAC/TTL y falla sin bloquear. | `CHANGES_REQUIRED`: se invoca para todo logout, no solo global, y no evalúa/materializa el umbral 5/h ni cubre sexta llamada. |
| SEC-11 | Predicados tenant para actor/global y clave HMAC. | Parcial: no prueba dos tenants ni tombstone Redis stale. |
| SEC-12 | `notifications` y `tracking` siguen sin puerto público/interno invocable. | `BLOCKED` externo: falta contrato de Producto/Arquitectura y ADR si altera límites. |

### Hallazgos y reproducción

1. **BLOCKER — SEC-BE005-12.** Continúa la ausencia de contrato/puerto para desvinculación MOBILE y presencia/rastreo. Reproducción ya registrada: ambos módulos contienen solo `package-info.java`. Requiere contrato público y, si corresponde, ADR; no se debe crear una integración ficticia.
2. **ALTA — CA-04 / SEC-BE005-09.** `LogoutSessionService` ejecuta `audit.record` solo después de pasar todas las validaciones; CSRF/ticket inválido lanza `Rejected` antes de esa llamada. Reproducción: invocar logout con CSRF inválido/ticket inexistente y un doble de auditoría; no recibe evento. Añadir evento técnico mínimo de denegación/fallo y prueba de saneamiento.
3. **ALTA — SEC-BE005-05.** `RefreshSessionTransactionIntegrationTest` contiene `concurrentRefreshCreatesOneSuccessorAndOneContractualReplay`, pero no una carrera refresh/logout. Reproducción: buscar los cuatro métodos `@Test` de esa clase; ninguno ejecuta ambos casos de uso concurrentemente ni verifica ambos órdenes. Añadir la prueba transaccional requerida.
4. **MEDIA — SEC-BE005-07.** `LogoutSessionService` invoca `abuse.record` sin condicionar `allSessions`; `RedisLogoutAbuseMonitor` solo incrementa/TTL, sin comportamiento para la sexta llamada. Reproducción: logout current/pending también invoca el monitor; seis llamadas globales solo incrementan. Limitarlo a global y definir/probar dedupe-alerta-backoff no bloqueante.

### Riesgo residual

La revocación durable, la tolerancia a auditoría indisponible y la configuración Bearer/PENDING cuentan con evidencia nueva; persisten sin prueba Redis stale, dos tenants, reintento current explícito y la carrera refresh/logout. SEC-12 mantiene el gate externo.

---

## QA independiente v5 — 2026-08-04

### Estado

`CHANGES_REQUIRED`

El candidato v5 no permite completar la matriz de aceptación: la nueva configuración de notificaciones rompe el contexto de `SecurityConfigurationTest`, que contiene la evidencia de la cadena HTTP/seguridad. La ejecución se aborta antes de V11, tenant y carrera refresh/logout. No procede emitir `PASS`.

### Candidato y manifiesto

- `HEAD`: `3a787569ca873f084e0b6f0e052988933935cda7`.
- Diff tracked: `1abf4404c732f33dded8e0e1f1baeea6410abab3`, coincidente con el paquete v5; `git diff --check HEAD` correcto.
- Manifiesto V4 comprobado: contrato/aplicación/adaptador/configuración de `notifications`, migración `V11`, consumo por `identityaccess` y pruebas asociadas presentes en el worktree.
- No se releyeron fuentes primarias ni se registran excepciones.

### Matriz resumida

| Criterio/control | Implementación/prueba | Resultado |
|---|---|---|
| CA-01 / SEC-06 | `LogoutSessionServiceTest` (7) pasó; cubre revocación y pending móvil. | Parcial; la suite completa abortó. |
| CA-02 / SEC-11 | Integración V11/tenant prevista en `RefreshSessionTransactionIntegrationTest`. | `NOT_EXECUTED`: Maven abortó antes de ejecutarla. |
| CA-03 / SEC-03 | `LogoutControllerTest` (3) pasó para WEB/MOBILE pending y mezcla; HTTP normal real depende de `SecurityConfigurationTest`. | `CHANGES_REQUIRED`: 29 errores de contexto impiden validar normal/cadena de seguridad. |
| CA-04 / SEC-09 | Servicio/auditoría revisados; evidencia completa depende de la matriz abortada. | `NOT_EXECUTED`. |
| SEC-01 | Autenticación/filtro HTTP ejercidos por `SecurityConfigurationTest`. | `CHANGES_REQUIRED`: contexto no inicia. |
| SEC-04 / SEC-05 | Revocación durable, V11 y carrera en integración Testcontainers. | `NOT_EXECUTED`: no alcanzada por el fallo anterior. |
| SEC-07 | `RedisLogoutAbuseMonitorTest` (1) pasó. | Parcial; no sustituye la matriz completa global 5/h. |
| SEC-08 | Respuestas neutrales básicas en controlador. | Parcial. |
| SEC-10 | V11 incluida en candidato; validación Flyway prevista en integración. | `NOT_EXECUTED`. |
| SEC-12 | Puerto público `RevokeInstallationsForSession` y V11 presentes; arquitectura prevista en pruebas. | `NOT_EXECUTED`: integración/arquitectura de la matriz final no completada. |

### Comandos/evidencia

- Se ejecutó, con Docker autorizado: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,RefreshSessionTransactionIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,SecurityConfigurationTest,RedisLogoutAbuseMonitorTest" test`.
- Pasaron antes del aborto: `HexagonalArchitectureTest` 3, `ModuleBoundaryTest` 1, `LogoutControllerTest` 3, `RedisLogoutAbuseMonitorTest` 1 y `LogoutSessionServiceTest` 7 (15 pruebas, 0 fallos/errores).
- Falló `SecurityConfigurationTest`: 29 pruebas, 29 errores; `RefreshSessionTransactionIntegrationTest` no fue ejecutada en esta corrida.

### Hallazgo

1. **ALTA — regresión de configuración que bloquea SEC-BE005-01/03 y la matriz HTTP.** `NotificationsConfiguration#revokeInstallationsForSession` requiere `JdbcTemplate`, pero `SecurityConfigurationTest` excluye `DataSourceAutoConfiguration` y no proporciona ese bean. Reproducción: ejecutar el comando anterior; el primer error es `NoSuchBeanDefinitionException: No qualifying bean of type JdbcTemplate` al crear `revokeInstallationsForSession`, seguido de 29 errores por el umbral de fallo del contexto. Ajustar el cableado de notificaciones para que sea compatible con el contexto sin datasource (o proporcionar el doble de puerto/JDBC de prueba) y reejecutar la matriz completa, incluida integración V11/tenant/carrera.

### Riesgo residual

Hasta corregir el contexto no hay evidencia QA reproducible para logout HTTP normal autenticado, V11/Flyway, aislamiento tenant, idempotencia de instalaciones, carrera refresh/logout, auditoría completa ni la totalidad de SEC-01..12. El `READY_FOR_HANDOFF` de Desarrollo no queda confirmado.

---

## QA afectado v6 — 2026-08-04

### Estado

`CHANGES_REQUIRED`

La remediación de wiring quedó validada, pero falta evidencia reproducible de la modalidad HTTP normal autenticada. No se puede emitir `PASS` para CA/SEC completos con pruebas que solo ejercen WEB/MOBILE pending y rutas de seguridad ajenas a `/auth/logout`.

### Integridad, manifiesto y comandos

- `HEAD` `3a787569ca873f084e0b6f0e052988933935cda7`; diff tracked `1abf4404c732f33dded8e0e1f1baeea6410abab3`, ambos coincidentes con el paquete v6; `git diff --check HEAD` correcto.
- Manifiesto funcional V11 comprobado frente al worktree: puerto público, servicio, adaptador JDBC y configuración de `notifications`, migración V11 y consumo desde `identityaccess` están presentes. El cableado queda condicionado a `JdbcTemplate`, resolviendo el contexto aislado sin datasource.
- `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=SecurityConfigurationTest" test` → `BUILD SUCCESS`, 29/29.
- Matriz Docker: `-Dtest=LogoutSessionServiceTest,LogoutControllerTest,RefreshSessionTransactionIntegrationTest,HexagonalArchitectureTest,ModuleBoundaryTest,SecurityConfigurationTest,RedisLogoutAbuseMonitorTest` → `BUILD SUCCESS`, 50/50; Testcontainers aplicó Flyway hasta V11.
- Complementos: `InboundJwtAuthenticatorTest,AuthenticationContractPolicyTest` → 12/12; `AuditEntryMigrationTest` con Docker → 5/5, incluida retención. El `51/51` declarado por Desarrollo no coincide con los 50 casos del comando reportado; registrar/corregir el conteo de evidencia.

### Matriz resumida

| Criterio/control | Evidencia QA v6 | Resultado |
|---|---|---|
| CA-01 / SEC-06 | Servicio 7/7 e integración 6/6: revocación/idempotencia y pending. | Parcial: falta ejercicio HTTP normal. |
| CA-02 / SEC-11 | Integración 6/6: global por tenant y tenant ajeno intacto; JWT 5/5. | PASS de la superficie persistente. |
| CA-03 / SEC-03 | `LogoutControllerTest` 3/3 cubre WEB/MOBILE pending y mezcla. | `CHANGES_REQUIRED`: falta normal HTTP autenticado. |
| CA-04 / SEC-09 | Servicio, integración y migración de auditoría 5/5. | PASS de evidencia ejecutada. |
| SEC-01 | `InboundJwtAuthenticatorTest` 5/5 y contexto de seguridad 29/29. | Parcial: falta conexión explícita Bearer → `/auth/logout` normal. |
| SEC-04 / SEC-05 | Integración 6/6: revocación durable, V11 y carrera refresh/logout. | PASS de la evidencia ejecutada. |
| SEC-07 | Monitor 1/1: sexta global deduplicada y Redis fallido no bloqueante. | PASS. |
| SEC-08 | Controlador pending y contexto de seguridad pasan con respuestas seguras. | Parcial por falta de error normal HTTP. |
| SEC-10 | `AuditEntryMigrationTest` 5/5: append-only, aislamiento y retención. | PASS. |
| SEC-12 | Puerto público de notificaciones, V11, revocación por `sessionFamilyId+tenantId` e invariantes arquitectónicos pasan. | PASS de notificaciones; tracking sin estado según paquete. |

### Hallazgo

1. **ALTA — evidencia obligatoria incompleta para CA-01/03 y SEC-BE005-01/03/06/08.** `LogoutControllerTest` contiene tres casos: WEB pending, MOBILE pending y mezcla; no hay caso normal con Bearer/actor autenticado. `SecurityConfigurationTest` (29/29) tampoco declara un caso `/auth/logout`. Reproducción: inspeccionar los métodos de ambas clases y ejecutar la matriz v6; todos pasan sin ejercer `POST /auth/logout` normal autenticado. Añadir un MockMvc de cadena real que pruebe Bearer normal válido → 204, CSRF WEB, rechazo de Bearer/ticket/cookie mezclados y error neutral sin llegar al caso de uso.

### Riesgo residual

La corrección de wiring, V11/Flyway, aislamiento tenant, carrera, auditoría, retención, límite global y revocación de instalaciones tienen evidencia reproducible. Permanece sin prueba la ruta HTTP normal, por lo que no se confirma la no-mezcla de canales ni la autenticación efectiva de ese endpoint.

---

## QA afectado v7 — 2026-08-04

### Estado

`CHANGES_REQUIRED`

El candidato v7 y la matriz ampliada son reproducibles, pero la remediación HTTP no prueba dos controles solicitados: CSRF WEB en la cadena MVC normal y rechazo de `PENDING + Authorization`. No corresponde elevar a Seguridad hasta que ambas mezclas/canales tengan evidencia observable.

### Integridad y evidencia ejecutada

- `HEAD` `3a787569ca873f084e0b6f0e052988933935cda7`, diff tracked `144e0d4c4fc04619a9a5b6edf070704074940493`, coincidente con el paquete v7; `git diff --check HEAD` correcto. Los archivos funcionales declarados (incluida V11 y notificaciones) permanecen presentes.
- Matriz elevada reproducida: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutControllerTest,LogoutSessionServiceTest,InboundJwtAuthenticatorTest,AuthenticationContractPolicyTest,SecurityConfigurationTest,RedisLogoutAbuseMonitorTest,RefreshSessionTransactionIntegrationTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` → `BUILD SUCCESS`, 68 pruebas, 0 fallos/errores; Testcontainers aplicó Flyway hasta V11.
- `LogoutControllerTest#normalBearerPassesInboundJwtFilterAndReachesDerivedActor` demuestra Bearer normal, filtro y actor derivado → 204. Persisten los huecos de abajo.

### Matriz resumida

| Criterio/control | Evidencia | Resultado |
|---|---|---|
| CA-01 / SEC-01 | Bearer normal MVC, JWT, servicio e integración pasan. | Parcial: falta WEB normal con CSRF en MVC. |
| CA-02 / SEC-11 | Integración V11 conserva tenant ajeno y predicados derivados. | PASS. |
| CA-03 / SEC-03 | WEB/MOBILE pending y ticket+cookie mezclados pasan. | `CHANGES_REQUIRED`: no existe `PENDING + Authorization`. |
| CA-04 / SEC-09/10 | Servicio, auditoría y migración/retención pasan. | PASS. |
| SEC-04/05/06 | Integración durable, carrera e idempotencia pasan. | PASS. |
| SEC-07 | Sexta global y Redis no bloqueante pasan. | PASS. |
| SEC-08 | Problemas neutrales/no-store cubiertos por controlador y configuración. | Parcial por mezcla Authorization no probada. |
| SEC-12 | Puerto público, V11 e invariantes arquitectónicos pasan. | PASS. |

### Hallazgos

1. **ALTA — SEC-BE005-03 / SEC-BE005-08, cobertura MVC de canal insuficiente.** La nueva prueba `normalBearerPassesInboundJwtFilterAndReachesDerivedActor` crea un `AuthenticatedActor` de rol SELLER y no envía `X-CSRF-Token`; el caso WEB/CSRF solo se ejercita en el servicio. Además, `mixedPendingCredentialsAreNeutralAndDoNotReachUseCase` mezcla ticket+cookie, pero no `X-Logout-Intent:PENDING` con `Authorization`. Reproducción: revisar los cuatro métodos de `LogoutControllerTest` y ejecutar la matriz v7 (68/68); ninguno construye esas solicitudes. Añadir MockMvc con cadena real para WEB normal válido/CSRF inválido y PENDING+Bearer, verificando 204 o 4xx neutral, `no-store` y que el caso de uso no reciba credenciales mezcladas.

### Riesgo residual

La funcionalidad persistente, multiempresa, V11, auditoría, retención, carrera y Bearer normal cuentan con evidencia. Falta confirmar en el adaptador HTTP que el canal WEB exige CSRF y que Authorization no puede mezclarse con PENDING; esas superficies siguen expuestas a regresión sin prueba.

---

## QA afectado v8 — 2026-08-04

### Estado

`PASS`

La huella y el manifiesto funcional v8 son consistentes con el candidato revisado. Se corrigió la evidencia HTTP pendiente: WEB normal transmite CSRF con actor derivado y `PENDING + Authorization` se rechaza antes del caso de uso. Los criterios CA-01..04 y SEC-BE005-01..12 cuentan con evidencia ejecutable reunida en esta QA y sus revalidaciones v5–v8.

### Matriz resumida

| Criterio/control | Evidencia reproducida | Resultado |
|---|---|---|
| CA-01 / SEC-01 / SEC-06 | Bearer normal, actor/sid derivado, idempotencia y refresh/logout. | PASS |
| CA-02 / SEC-02 / SEC-11 | Global por tenant y tenant ajeno intacto en integración V11. | PASS |
| CA-03 / SEC-03 / SEC-08 | WEB pending, MOBILE pending, normal Bearer, WEB+CSRF y PENDING+Authorization neutral. | PASS |
| CA-04 / SEC-09 / SEC-10 | Auditoría mínima, migración append-only y retención. | PASS |
| SEC-04 / SEC-05 | PostgreSQL/Flyway V11, revocación durable y carrera refresh/logout. | PASS |
| SEC-07 | Sexta revocación global deduplicada; Redis no bloqueante. | PASS |
| SEC-12 | Puerto público de notificaciones, revocación por familia+tenant e invariantes arquitectónicos. | PASS |

### Comandos/evidencia

- Integridad: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; diff `144e0d4c4fc04619a9a5b6edf070704074940493`; `git diff --check HEAD` correcto.
- Matriz QA elevada: `mvn -o "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutControllerTest,LogoutSessionServiceTest,InboundJwtAuthenticatorTest,AuthenticationContractPolicyTest,SecurityConfigurationTest,RedisLogoutAbuseMonitorTest,RefreshSessionTransactionIntegrationTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` → `BUILD SUCCESS`, 69 pruebas, 0 fallos/errores; Testcontainers/Flyway hasta V11.
- `LogoutControllerTest#webBearerLogoutForwardsCsrfAndPendingAuthorizationIsRejectedBeforeUseCase`: WEB Bearer+cookie+CSRF devuelve 204 y reenvía CSRF; PENDING+Authorization devuelve 400 y no invoca el caso de uso.

### Hallazgos

Ninguno.

### Regresión relevante y riesgos residuales

- La matriz Dev declara 58 casos y la selección QA ampliada ejecutó 69; la diferencia corresponde a pruebas complementarias de JWT, contrato, auditoría/retención y arquitectura, no a una discrepancia funcional.
- Riesgo residual operativo: disponibilidad real de PostgreSQL/Redis/Docker fuera de pruebas; la lógica de revocación permanece fail-closed y Redis no es fuente positiva de sesión.

---

## QA independiente v14 — H-03 (2026-08-05)

### Estado

`PASS`

### Identidad y entradas

- HU: `BE-005 — Cerrar y revocar sesión`.
- Paquete: `docs/handoffs/governance/BE-005-context-package.md`, revisión `v14`, SHA-256 `541CEB8A1B1D1AD3D81524795DAD17D326E9547C5BDD1E4A3E7083D2D05178AA`.
- Preflight: `docs/handoffs/security/BE-005-security-preflight.md`, «Revalidación v14 — evidencia de cierre H-03», `PREFLIGHT` / `ADVISORY`.
- Handoff Desarrollo: `docs/handoffs/backend/BE-005-backend-handoff.md`, «Revalidación v14 — evidencia H-03 completada», `READY_FOR_HANDOFF`.
- Candidato verificado: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `b5ddac5b7fd730a248cca12e293984daf69e540f`; staging vacío; `git diff --check HEAD` correcto.
- Alcance QA: exclusivamente H-03 y `SEC-BE005-03,04,05,06,08,09,11,12`. `SEC-BE005-01,02,07,10`: `NOT_APPLICABLE` para este delta, sin reutilizar estados de otra huella.

### Matriz resumida

| Criterio/control | Implementación comprobada | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| H-03 / SEC-BE005-03 | `consumeRevocationTicket` condiciona digest, familia activa/no vencida y canal `MOBILE`; controlador separa modalidades. | `webBoundRevocationTicketIsRejectedWithoutMutatingItsFamily`; `LogoutControllerTest`. | PASS |
| H-03 / SEC-BE005-04 | Consumo, revocación, instalaciones y auditoría usan la transacción de logout. | `mobilePendingRollbackRestoresDigestWhenInstallationOrAuditFails`. | PASS |
| H-03 / SEC-BE005-05 | `UPDATE ... RETURNING` permite un único consumo ganador. | `concurrentMobileTicketConsumptionHasOneWinnerAndLeavesOtherTenantUntouched`; además, carrera refresh/logout existente. | PASS |
| H-03 / SEC-BE005-06 | El digest se limpia sólo para el ganador; replay rechaza sin segundo efecto. | Prueba concurrente y `mobileReplayHasNeutralRejectionAndDoesNotRepeatInstallationRevocation`. | PASS |
| H-03 / SEC-BE005-08 | Error `LOGOUT_INVALID`, `no-store` y correlación; comando de auditoría recibe sólo IDs técnicos. | `rejectedMobileTicketReturnsNeutralProblemWithoutEchoingTicket`; inspección de `LogoutSessionService`. | PASS |
| H-03 / SEC-BE005-09 | Sólo el consumo exitoso llega a `LOGGED_OUT`; excepción posterior hace rollback. | Pruebas de rollback/concurrencia verifican cero o una auditoría, según resultado. | PASS |
| H-03 / SEC-BE005-11 | Familia y tenant se obtienen de la fila consumida y los efectos derivados reciben esos IDs. | Concurrencia con tenant ajeno intacto: digest, sesión y auditoría. | PASS |
| H-03 / SEC-BE005-12 | `LogoutSessionService` invoca sólo el puerto público `RevokeInstallationsForSession`. | Rollback por fallo del puerto, replay sin segunda llamada y `ModuleBoundaryTest`. | PASS |

### Comandos y evidencia

- `git diff --check HEAD`; `git diff HEAD | git hash-object --stdin`; `git diff --cached --quiet` → diff coincidente, sin errores y staging vacío.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` → `BUILD SUCCESS`, 19 pruebas, 0 fallos/errores.
- `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RefreshSessionTransactionIntegrationTest" test` → `BUILD SUCCESS`, 12 pruebas, 0 fallos/errores; Testcontainers PostgreSQL/PostGIS y Flyway V1–V11. El primer intento sandbox no pudo acceder al pipe de Docker; la repetición autorizada aportó la evidencia de integración.

### Hallazgos

Ninguno.

### Regresión relevante y riesgos residuales

- La revisión no detectó regresión en canal WEB/MOBILE, replay, rollback, concurrencia, aislamiento tenant, instalaciones, auditoría ni respuesta HTTP neutral del delta H-03.
- Riesgo residual operativo: disponibilidad de PostgreSQL, Redis y Docker fuera del entorno de prueba. El saneamiento no-HTTP de `SEC-BE005-08` queda disponible para la revisión final de Seguridad, conforme al preflight, sin constituir hallazgo QA de este delta.

---

## QA independiente v16 — F14-01 y F14-02 (2026-08-05)

### Estado

`PASS`

### Identidad y alcance

- HU `BE-005`; paquete canónico v16, preflight v16 `ADVISORY` y handoff de Desarrollo «Revalidación v16 — F14-01 y F14-02» `READY_FOR_HANDOFF` revisados.
- Antes y después: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; `git diff HEAD | git hash-object --stdin` `524f08838e6f2b4f8719bdd0bbf67309156082bd`.
- Manifiesto: 31/31 rutas, estado Git y SHA-256 correctos; hash global `F4550469865912C84F2A85492D664E601AEEE5CA15FE301CF560D11BFC2B91D0`.
- Alcance exclusivo: F14-01/F14-02 y `SEC-BE005-04,05,06,09,11`. No se releyeron HU, contratos ni ADR; no hubo excepción a fuentes primarias.

### Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| F14-01 | Manifiesto v16 vincula las 31 rutas funcionales tracked/untracked. | Recalculo independiente de ruta, estado y SHA-256; hash global. | PASS |
| F14-02 / SEC-BE005-04 | V12 impone unicidad parcial; consumo sólo con cardinalidad uno y en transacción PostgreSQL. | `RevocationTicketIntegrityIntegrationTest`: V12 y V11 legado, sin mutación en rechazo; regresión rollback MOBILE. | PASS |
| SEC-BE005-05 | `FOR UPDATE` para coincidencias y actualización sólo de asociación única. | Carrera de consumo MOBILE: un ganador; integración dirigida. | PASS |
| SEC-BE005-06 | Digest se consume una vez; replay no resuelve familia ni repite efecto. | Replay y carrera MOBILE; auditoría/instalación única. | PASS |
| SEC-BE005-09 | Sólo la resolución ganadora llega a `LOGGED_OUT`; rollback incluye auditoría. | Legado ambiguo deja `audit_entry` vacío; rollback de instalaciones y auditoría. | PASS |
| SEC-BE005-11 | Unicidad global V12 y rechazo fail-closed de ambigüedad V11 preservan ambos tenants. | Duplicado cross-tenant V12 y V11; familia/digest/auditoría ajenos intactos. | PASS |

### Comandos y evidencia

- Recalculo de manifiesto y de identidad antes/después: 31/31, hash global v16; staging `0`; `git diff --check HEAD` correcto.
- Desde `backend/followupbussiness`: `mvn -o "-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository" "-Dtest=RevocationTicketIntegrityIntegrationTest,RefreshSessionTransactionIntegrationTest" test` → `BUILD SUCCESS`, 14 pruebas, 0 fallos/errores, PostgreSQL/Testcontainers y Flyway hasta V12.
- El primer intento sandbox no pudo acceder al pipe Docker; la repetición autorizada contra el Docker local aportó la evidencia nueva anterior.
- Se reutiliza evidencia verificable del handoff Dev del mismo candidato para `LogoutSessionServiceTest,LogoutControllerTest,HexagonalArchitectureTest,ModuleBoundaryTest`: 19 pruebas PASS. No se repitió: F14-02 no añade capas, dependencias ni límites arquitectónicos.

### Hallazgos

Ninguno en el alcance revalidado.

### Regresión relevante y riesgos residuales

- Regresión cubierta: consumo/replay concurrente, rollback de digest-revocación-instalaciones-auditoría, V12 y datos legado V11 ambiguos, y aislamiento cross-tenant.
- Riesgo residual: la migración V12 puede requerir saneamiento/validación operacional de datos productivos preexistentes antes de desplegar; no altera el resultado QA del candidato ni se ejecutó contra producción.
