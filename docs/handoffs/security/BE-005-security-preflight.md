# Preflight de Seguridad — BE-005

## Estado

`ADVISORY` — aplica: autenticación/revocación de sesiones, autorización por recurso y rol, aislamiento tenant, JWT, CSRF, refresh/access, Redis, auditoría y presencia/WebSocket. Este preflight no revisa ni aprueba código.

## Candidato y fuente distribuida

- Candidato funcional: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; diff tracked/staged vacío, SHA-1 `5f282702bb03ef11d7184d19c80927b47f919764`.
- El paquete y este handoff son artefactos de gobernanza no rastreados; no alteran el candidato funcional.
- Fuente única: `docs/handoffs/governance/BE-005-context-package.md`, SHA-256 `1CFAD624D4639AE4589D744C42A90D8204F777D6E62673693A6612F90CDFB456`.
- Excepciones de relectura: ninguna. Implementación, pruebas y escaneos: `NOT_EXECUTED` por diseño de preflight.

## Modelo de riesgo

Activos: familias refresh, access tokens, cuenta/tenant/roles persistidos, cookie/ticket pendiente, auditoría y presencia/rastreo. Abusos prioritarios: revocación ajena/global indebida, CSRF/canal mezclado, reutilización por carrera o Redis stale, rate limit que impide revocar, fuga por errores/auditoría y reconexión tras revocación.

## Controles exigidos

| Control | Implementación observable | Prueba obligatoria |
|---|---|---|
| SEC-BE005-01 | Actor, `sid`, cuenta, tenant y rol solo desde JWT firmado y persistencia; familia/cuenta/empresa activas. | JWT alterado y estado revocado/inactivo/cross-tenant no alcanzan el caso de uso. |
| SEC-BE005-02 | Actual limita a `sid`; global a cuenta+tenant autenticados y rol autorizado; ningún ID cliente amplía alcance. | Familias/cuentas/tenants/roles múltiples verifican exactamente las familias revocadas. |
| SEC-BE005-03 | Normal, WEB pending y MOBILE pending excluyentes; CSRF/Origin/cookie/ticket por canal. | Matriz de modalidades y mezclas prohibidas; entrada inválida no revoca recurso ajeno. |
| SEC-BE005-04 | PostgreSQL decide access/refresh; revocación durable antes de tombstone; Redis sin estado positivo. | Access/refresh post-logout rechazados; Redis caído/stale no reactiva. |
| SEC-BE005-05 | Refresh/logout comparten transición transaccional. | Carrera en ambos órdenes termina revocada, sin token aceptable. |
| SEC-BE005-06 | Reintentos y pending ya aplicado son neutrales/idempotentes, sin credenciales ni identidad. | Repeticiones normal/WEB/MOBILE antes y después de revocar. |
| SEC-BE005-07 | Límite global 5/h solo dedupe/alerta/backoff fuera de la revocación. | Exceso y limitador caído conservan revocación; no 429/503 impeditivo. |
| SEC-BE005-08 | `problem+json`, correlation, no-store y saneamiento de respuestas/logs/métricas. | JWT/CSRF/ticket/forma inválidos no filtran token, digest, tenant, cuenta ni estado. |
| SEC-BE005-09 | Éxitos, globales, denegados y fallos se auditan por puerto público y campos mínimos. | Evento sin JWT, refresh, ticket, CSRF, Authorization, digest ni payload. |
| SEC-BE005-10 | Append-only/retención vigente 365/90/30 y sin campos sensibles nuevos. | Inspección y prueba de evento; migración/config afectada demuestra retención. |
| SEC-BE005-11 | Consultas/claves con tenant derivado; Redis solo tombstones con namespace tenant. | Dos tenants/cuentas/familias: sin cruce de fila, clave, métrica o respuesta. |
| SEC-BE005-12 | Familia/cuenta es recurso; presencia/notificaciones exclusivamente por puerto público. | Rol/tenant/recurso incorrectos sin efecto lateral; ámbito revocado no reconecta/rastrea. |

## Riesgos residuales y gate

Riesgos residuales: posible ausencia de puerto Backend para presencia, matriz exacta de roles y disponibilidad de auditoría. Desarrollo debe registrarlos sin acoplar tablas ajenas ni inventar permisos.

El gate de Desarrollo exige implementación y prueba observable de los doce controles aplicables; esta fase no constituye una aprobación.

## Revalidación v13 — delta H-03 (2026-08-05)

### Identidad y estado

| Campo | Valor |
|---|---|
| HU | `BE-005 — Cerrar y revocar sesión` |
| Tipo de revisión | `PREFLIGHT` |
| Estado | `ADVISORY` |
| Paquete canónico | `docs/handoffs/governance/BE-005-context-package.md`, revisión vigente `v13`, SHA-256 `C254E3AA4B78ED2EEA588A1DBD4FC57F8695D871668BEAC6AFEC3D4B075F5054` |
| Candidato fijo | `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `fe5e66df0b2cc27c9fd25d2065c2b094640a5cbd`; staging `vacío` |
| Documentos de entrada | Paquete canónico v13 anterior y `docs/handoffs/backend/BE-005-backend-handoff.md`, revalidación v13, estado `BLOCKED` por preflight pendiente |
| Excepciones de relectura | Ninguna; no se releen historia, contratos, ADR, código ni pruebas |

El `ADVISORY` anterior queda explícitamente no reutilizado porque pertenece a otra huella candidata. Esta sección revalida el preflight sólo para la identidad v13 y el delta H-03 descrito en el paquete. La evidencia histórica `docs/handoffs/backend/BE-005-remediation-v13-candidate.md` se mantiene únicamente como referencia declarada por el paquete; no es un handoff canónico ni autorización de fase.

### Triage y superficie H-03

H-03 sí aplica a Seguridad: cambia el límite entre una entrada MOBILE no confiable y la revocación durable al sustituir el uso reutilizable del digest por un consumo condicional atómico `UPDATE ... RETURNING`. El cambio alcanza el puerto y adaptador de sesiones, el servicio de logout y la transacción que agrupa consumo, revocación, instalaciones y auditoría. No declara cambios de contrato externo, migración, autenticación WEB/JWT, Redis ni retención.

- Activos: digest HMAC del ticket de revocación, familia de sesión y su estado revocado, unicidad del evento `LOGGED_OUT`, vinculaciones MOBILE y atomicidad de la transacción.
- Actores: usuario MOBILE legítimo; atacante con ticket robado o repetido; solicitudes concurrentes con el mismo ticket; otro tenant/familia; fallo posterior de auditoría o instalaciones.
- Límites de confianza: header/ticket no confiable → derivación de digest → PostgreSQL; resultado de consumo → caso de uso; transacción `LoginConfiguration` → persistencia de sesión, instalaciones y auditoría.
- Abusos prioritarios: doble consumo concurrente y doble efecto lateral; aceptación de ticket vencido, ya revocado o de canal distinto; quema del ticket sin revocar por rollback incompleto; segunda auditoría `LOGGED_OUT` en replay; revocación o desvinculación de otra familia/tenant; fuga del ticket/digest o de su validez por respuesta/error.

### Matriz SEC-BE005 afectada

Todas las pruebas de esta matriz son obligatorias para el candidato v13. En este preflight su estado es `NOT_EXECUTED`: se definen como controles verificables, no se ejecutan ni se consideran satisfechas.

| Control | Impacto H-03 / implementación exigida | Prueba obligatoria v13 | Estado preflight |
|---|---|---|---|
| `SEC-BE005-03` | El consumo sólo acepta un ticket asociado a una familia `MOBILE`; un ticket de otro canal, vencido, inexistente o mezclado con otra modalidad no alcanza revocación ni efectos laterales. | Integración PostgreSQL para `MOBILE` válido y casos `WEB`, vencido, ausente/inválido y combinación prohibida; verificar cero mutaciones en los rechazos. | `NOT_EXECUTED` |
| `SEC-BE005-04` | El éxito del consumo y la revocación durable permanecen en una sola transacción; no puede quedar una familia activa con el digest consumido ni una familia revocada con ticket reutilizable. | Verificar en PostgreSQL que el éxito limpia digest y revoca la familia; un fallo posterior revierte ambos cambios y un reintento controlado puede completar la operación. | `NOT_EXECUTED` |
| `SEC-BE005-05` | El `UPDATE ... RETURNING` debe decidir un único ganador bajo concurrencia y coordinarse con la revocación dentro de la misma transacción. | Dos consumos concurrentes del mismo ticket: exactamente uno obtiene la familia y completa la revocación; el otro no produce revocación, auditoría ni desvinculación adicional. Estado final consistente y no reutilizable. | `NOT_EXECUTED` |
| `SEC-BE005-06` | El ticket es de un uso. Replay o reintento posterior no vuelve a entregar la familia ni repite efectos; la respuesta permanece neutral y no emite credenciales. | Primer uso válido seguido de uno o más replays, incluidos replays concurrentes: un solo consumo y un solo conjunto de efectos; ningún dato de familia, cuenta o tenant en la respuesta. | `NOT_EXECUTED` |
| `SEC-BE005-08` | Ticket, digest y diferencias de estado interno no pueden aparecer en respuesta, excepción, log, métrica ni auditoría. | Inspeccionar respuestas/evidencia capturada para ticket inválido, vencido y replay; comprobar ausencia de ticket crudo, digest, familia, tenant y detalle que permita enumerar validez. | `NOT_EXECUTED` |
| `SEC-BE005-09` | Sólo el consumo ganador puede registrar `LOGGED_OUT`; replay/rechazo no genera una segunda auditoría de éxito. Auditoría y consumo comparten rollback. | Contar eventos tras consumo y replay/concurrencia: exactamente un `LOGGED_OUT`; forzar fallo posterior y comprobar que no queda evento ni consumo parcial. | `NOT_EXECUTED` |
| `SEC-BE005-11` | El digest consumido sólo puede resolver la familia asociada y sus efectos deben conservar el tenant derivado de esa fila; ninguna colisión o replay cruza familia/tenant. | Preparar dos tenants/familias y consumir el ticket de uno; comprobar que sesión, digest, instalaciones y auditoría del otro permanecen intactos. | `NOT_EXECUTED` |
| `SEC-BE005-12` | La desvinculación MOBILE usa únicamente la familia y tenant obtenidos por el consumo ganador y participa en la transacción; un replay no repite el puerto ni afecta otra instalación. | Éxito, replay y fallo del puerto de instalaciones: una sola invocación autorizada en éxito, ninguna en replay y rollback completo ante fallo, sin efecto lateral cross-tenant. | `NOT_EXECUTED` |

`SEC-BE005-01`, `SEC-BE005-02`, `SEC-BE005-07` y `SEC-BE005-10` no cambian por H-03: continúan aplicables a BE-005 y deberán conservar su evidencia para esta misma identidad candidata, pero este preflight no los ejecuta, aprueba ni marca `PASS`.

### Evidencia y riesgos residuales

- `PASS` verificable en esta fase: identidad del paquete, cuyo SHA-256 en disco coincide con `C254E3AA4B78ED2EEA588A1DBD4FC57F8695D871668BEAC6AFEC3D4B075F5054`.
- `PASS` reportado por el paquete, no ejecutado por Seguridad preflight: 8 pruebas de `LogoutSessionServiceTest`, 9 pruebas de `RefreshSessionTransactionIntegrationTest`, `git diff --check` y `graphify update .`. Se conserva como evidencia disponible, no como aprobación ni resultado independiente de este rol.
- `NOT_EXECUTED`: inspección de código/diff, ejecución de pruebas, carrera concurrente dirigida, revisión de respuestas/logs/auditoría y cualquier escaneo. Es intencional por el alcance `PREFLIGHT`.
- Riesgos residuales hasta verificación posterior: exclusión mutua real bajo concurrencia; rollback atómico a través de sesión, instalaciones y auditoría; neutralidad observable del replay; aislamiento tenant de efectos derivados; ausencia de duplicados `LOGGED_OUT` y de fuga de ticket/digest.

Este `ADVISORY` define controles para el delta H-03. No revisa ni aprueba código, no equivale a Seguridad final y no autoriza por sí mismo QA, Seguridad final, DoF ni cierre.

## Revalidación v14 — evidencia de cierre H-03 (2026-08-05)

| Campo | Valor |
|---|---|
| HU / tipo / estado | `BE-005 — Cerrar y revocar sesión` / `PREFLIGHT` / `ADVISORY` |
| Paquete | `docs/handoffs/governance/BE-005-context-package.md`, revisión `v14`, SHA-256 `541CEB8A1B1D1AD3D81524795DAD17D326E9547C5BDD1E4A3E7083D2D05178AA` |
| Candidato | `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `b5ddac5b7fd730a248cca12e293984daf69e540f`; staging vacío |
| Entradas | Paquete v14 y handoff Backend canónico, última sección v13 `BLOCKED` |
| Excepciones | Ninguna: no se releen fuentes primarias, código ni pruebas; el preflight no ejecuta evidencia. |

El `ADVISORY` v13 no se reutiliza: corresponde a `fe5e66…b094`. Esta revisión considera sólo la nueva evidencia de pruebas del candidato v14 y no es una aprobación de código.

| Control afectado | Amenaza / evidencia que deberá conservar Desarrollo | Estado de preflight |
|---|---|---|
| `SEC-BE005-03` | Ticket asociado a `WEB` debe rechazarse sin mutar familia, digest, auditoría ni instalaciones. | `NOT_EXECUTED` |
| `SEC-BE005-04`, `09`, `12` | Un fallo posterior de instalaciones o auditoría revierte digest, revocación, auditoría y efecto lateral. | `NOT_EXECUTED` |
| `SEC-BE005-05`, `06` | Dos consumos MOBILE concurrentes tienen un ganador, replay sin segundo efecto/auditoría/instalación. | `NOT_EXECUTED` |
| `SEC-BE005-08` | Respuesta HTTP neutral no refleja ticket; confirmar que auditoría, logs y métricas no introducen ticket/digest. | `NOT_EXECUTED` |
| `SEC-BE005-11` | Tenant/familia ajenos siguen intactos tras consumo y replay concurrente. | `NOT_EXECUTED` |

`SEC-BE005-01`, `02`, `07` y `10` no cambian por este delta y continúan aplicables. El paquete reporta 19 pruebas unitarias/HTTP/arquitectura y 12 de integración como `PASS`; este preflight no las ejecutó. Riesgo residual: la evidencia v14 prueba neutralidad HTTP, mientras que el saneamiento no-HTTP de `SEC-BE005-08` requiere verificación independiente posterior. No hay fallos observados ni autorización de QA, Seguridad final, DoF o cierre.

## Revalidación v16 — integridad F14-01 y remediación F14-02 (2026-08-05)

### Identidad y estado

| Campo | Valor |
|---|---|
| HU | `BE-005 — Cerrar y revocar sesión` |
| Tipo de revisión | `PREFLIGHT` |
| Estado | `ADVISORY` |
| Paquete canónico | `docs/handoffs/governance/BE-005-context-package.md`, revisión vigente `v16`, SHA-256 `2BAD5011D428290EA32C19C3E47B6882A5DEFB9EE9C7B6D6FCDF705893D4AE81` |
| Candidato fijo | `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; object ID de `git diff HEAD` `524f08838e6f2b4f8719bdd0bbf67309156082bd`; staging `vacío` |
| Manifiesto funcional | 31 rutas verificadas por ruta, estado y SHA-256; hash global `F4550469865912C84F2A85492D664E601AEEE5CA15FE301CF560D11BFC2B91D0` |
| Entradas | Paquete canónico v16 y este informe canónico previo |
| Excepciones de relectura | Ninguna; no se releyeron historia, contratos, ADR, código ni pruebas |

La identidad anterior v14 no se reutiliza porque no vinculaba el conjunto funcional completo ni la remediación F14-02. F14-01 se registra exclusivamente como control de integridad del candidato: el manifiesto fija también las rutas funcionales no rastreadas por Git y permite asociar posteriormente evidencia y resultados a una identidad reproducible. Su verificación es `PASS`; no constituye aprobación del contenido de esas rutas.

### Triage y modelo de riesgo del delta

El preflight aplica porque F14-02 modifica la integridad y cardinalidad con las que un ticket MOBILE no confiable resuelve una familia de sesión. Los activos son el digest del ticket, la familia revocada, el aislamiento tenant, la atomicidad del consumo y la unicidad de la auditoría. Los actores relevantes son el usuario legítimo, un atacante con ticket repetido o colisionado, solicitudes concurrentes y datos legados ambiguos. El límite de confianza va del ticket recibido a PostgreSQL y desde la fila resuelta a revocación, instalaciones y auditoría dentro de la transacción.

Escenarios de abuso prioritarios: un mismo digest asociado a más de una familia o tenant; selección arbitraria de una fila ambigua; doble ganador concurrente; replay con segunda auditoría o efecto lateral; y mutación parcial antes de detectar cardinalidad inválida. La restricción parcial V12 y la exigencia de cardinalidad exactamente uno son los controles declarados por el paquete para estos escenarios.

### Matriz SEC afectada

| Control | Impacto de F14-01/F14-02 e implementación exigida | Verificación obligatoria posterior | Estado preflight |
|---|---|---|---|
| `SEC-BE005-04` | El candidato completo queda fijado por F14-01. F14-02 debe impedir que una resolución ambigua consuma el digest o altere la revocación durable; consumo y revocación conservan una única transacción PostgreSQL. | Esquema V12 rechaza duplicados y el escenario legado con duplicados termina sin digest consumido ni familia revocada; un fallo posterior revierte todo. | `NOT_EXECUTED` |
| `SEC-BE005-05` | El bloqueo de filas coincidentes y la comprobación de cardinalidad deben conservar un único ganador bajo concurrencia, sin selección dependiente del orden. | Carrera de consumos del mismo ticket: exactamente un ganador cuando existe una sola asociación; con asociación ambigua, cero ganadores y cero mutaciones. | `NOT_EXECUTED` |
| `SEC-BE005-06` | Un ticket consumido o una resolución inválida no puede producir un segundo efecto; el rechazo permanece neutral e idempotente. | Consumo seguido de replay, además de replay concurrente y digest legado duplicado: no hay segunda revocación, instalación, auditoría ni dato identificador en respuesta. | `NOT_EXECUTED` |
| `SEC-BE005-09` | Sólo una resolución inequívoca y ganadora puede registrar `LOGGED_OUT`; cardinalidad distinta de uno y rollback no dejan auditoría de éxito. | Contar auditorías tras éxito, replay, concurrencia, duplicado legado y fallo posterior: una para el ganador válido y cero para los demás casos. | `NOT_EXECUTED` |
| `SEC-BE005-11` | V12 impone unicidad global del digest no nulo y la lectura exige cardinalidad uno, evitando que una colisión alcance otra familia o tenant incluso ante esquema legado. | Dos tenants: V12 rechaza el digest duplicado sin alterar la primera familia; bajo V11 simulado, la ambigüedad no muta sesión, digest, instalaciones ni auditoría de ningún tenant. | `NOT_EXECUTED` |

`SEC-BE005-01`, `02`, `03`, `07`, `08`, `10` y `12` no cambian por F14-01/F14-02. Continúan aplicables a la HU, pero este preflight no los ejecuta, aprueba ni marca `PASS`.

### Evidencia, controles no ejecutados y riesgo residual

- `PASS`: HEAD, staging, object ID Git y las 31 rutas del manifiesto coinciden con el paquete v16. Es sólo integridad F14-01.
- `NOT_EXECUTED`: inspección del diff o código, pruebas unitarias/integración/concurrencia, migración V12, rollback, respuestas, auditoría, logs y escaneos. La evidencia `PASS` declarada en el paquete no se repitió ni se convierte en resultado independiente de Seguridad.
- Riesgos residuales hasta las fases autorizadas: comportamiento real de V12 sobre datos preexistentes; exclusión mutua y cardinalidad bajo concurrencia; rollback conjunto de consumo, revocación, instalaciones y auditoría; neutralidad observable del rechazo; y ausencia de efectos cross-tenant.

Este `ADVISORY` fija los controles afectados para el candidato v16. No revisa ni aprueba código, no inicia Desarrollo, QA, Seguridad final o DoF y no autoriza cierre ni fases posteriores.

## Revalidación v17 — retención de auditoría parametrizada (2026-08-05)

### Identidad y estado

| Campo | Valor |
|---|---|
| HU | `BE-005 — Cerrar y revocar sesión` |
| Tipo de revisión | `PREFLIGHT` |
| Estado | `ADVISORY` |
| Paquete canónico | `docs/handoffs/governance/BE-005-context-package.md`, revisión `v17`, SHA-256 `47BB21546FF506A057C29C1CD88F7667724DC5AE44307853C837BA841D971A2E` |
| Candidato fijo | Commit y `HEAD` `a40a44735715b7557c3e57671351dd6b6ef97ed7`, padre `dd8c14b755cfbd166c5a669060de51775c228b41`, asunto `fix(audit): respetar corte de retencion`; staging `vacío` |
| Entrada de Desarrollo consultada | `docs/handoffs/backend/BE-005-backend-handoff.md`, SHA-256 `2318A3E7430CA093B5BEE40CF5EAD92F212E493D1CF4D3C12AB09CDE76DB0B4F`; su última sección registra la corrección provisional anterior al commit y no sustituye el handoff v17 posterior a este preflight |
| Excepciones de relectura | Ninguna fuente primaria reabierta; se inspeccionó exclusivamente el diff de las tres rutas fijadas por el paquete v17 |

La identidad Git, el staging vacío y el delta exacto son `PASS`. `git diff --check a40a447^ a40a447` también es `PASS`. Estos resultados prueban integridad del candidato, no aprobación del código ni satisfacción de `SEC-BE005-10`.

### Triage, superficie y modelo de riesgo

El preflight aplica porque el delta cambia la ruta privilegiada que elimina evidencia de auditoría y, por tanto, la superficie de retención, integridad y mínimo privilegio de `SEC-BE005-10`. El commit contiene exactamente:

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/adapter/out/persistence/JdbcAuditEntryStore.java` (`M`).
- `backend/followupbussiness/src/main/resources/db/migration/V13__parameterize_audit_retention_purge.sql` (`A`).
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/persistence/AuditEntryMigrationTest.java` (`M`).

Activos: entradas append-only, contexto de red, ventanas 365/90 días, capacidad de purga acotada y credenciales/privilegios `audit_writer`, `audit_purger` y `audit_owner`. Actores: scheduler legítimo, identidad runtime de purga, escritor sin permiso de borrado y un actor que obtenga o herede un rol mal configurado. Límites de confianza: corte/lote calculados por la aplicación y enviados por JDBC; llamada a funciones PostgreSQL `SECURITY DEFINER`; y separación entre roles de escritura, propiedad y purga.

Escenarios de abuso prioritarios: adelantar el corte para borrar evidencia vigente; usar lotes nulos, cero o excesivos para sobreborrado o agotamiento; discrepancia de reloj que elimine el borde exacto; invocar una sobrecarga heredada para eludir corte/lote seleccionados; obtener ejecución desde `PUBLIC` o `audit_writer`; manipular `search_path`; y carreras de purgadores que cuenten o eliminen dos veces. El diff observado usa parámetros JDBC, valida corte futuro y lote `1..500`, fija `search_path`, conserva `FOR UPDATE SKIP LOCKED` y revoca `PUBLIC`, pero su eficacia queda sujeta a las pruebas siguientes.

### Matriz afectada y pruebas exigidas

| Control | Implementación exigida para v17 | Evidencia obligatoria de Desarrollo/QA | Estado preflight |
|---|---|---|---|
| `SEC-BE005-10` | El `Clock` del caso de uso debe gobernar el corte transmitido por `JdbcAuditEntryStore`; las funciones parametrizadas deben borrar sólo filas con `occurred_at < p_before`, respetar lotes `1..500`, preservar el orden contexto de red antes de entrada y mantener append-only salvo la purga autorizada. `SECURITY DEFINER` debe tener propietario y `search_path` fijos, sin ejecución para `PUBLIC` o escritor. | Ejecutar `AuditEntryMigrationTest` completo sobre Flyway V1–V13 y verificar: borde exacto 365 días conservado y 366 eliminado; contexto de red 90 días antes que entradas 365; lotes 1 y 500, repetición acotada e idempotente; rechazo separado de corte futuro/nulo y lote nulo/0/501; migración V12→V13 con datos existentes; dos purgadores concurrentes sin doble eliminación/conteo; matriz de privilegios para funciones nuevas y heredadas (`audit_purger` permitido, `PUBLIC`/`audit_writer` denegados) y DML directo denegado. | `NOT_EXECUTED` |

No hay otro control `SEC-BE005-*` directamente modificado por este commit: no cambia forma del evento, endpoint, JWT, tenant, Redis, WebSocket ni datos personales. `SEC-BE005-09` permanece como requisito no afectado; sólo debe comprobarse como regresión que la purga no altera registros vigentes ni introduce una vía de mutación distinta de la eliminación autorizada.

### Evidencia disponible, controles no ejecutados y riesgos residuales

- `PASS`: identidad exacta del commit/HEAD, padre, staging vacío, tres rutas del delta y `git diff --check`.
- `PASS` reportado por el paquete, no ejecutado por Seguridad: `AuditEntryMigrationTest` con 5 pruebas y Flyway V1–V13. Se entrega como evidencia disponible, no como aprobación independiente.
- `NOT_EXECUTED`: Maven, Testcontainers, migración incremental V12→V13, concurrencia de purgadores, casos inválidos separados, matriz completa de privilegios y cualquier escaneo general. No se ejecutan por diseño de este preflight acotado.
- Riesgos residuales: las funciones sin argumentos heredadas siguen siendo una ruta alternativa hasta demostrar su necesidad y privilegios efectivos; la prueba visible agrupa corte futuro y lote 501 en una misma invocación y no demuestra cada guardia por separado; falta evidencia dirigida de `NULL`, límites de lote, upgrade con datos y concurrencia.

### Siguiente gate

`ADVISORY` — queda habilitado únicamente Desarrollo v17 para vincular implementación y evidencia de `SEC-BE005-10` a `a40a44735715b7557c3e57671351dd6b6ef97ed7` en el handoff Backend canónico. Este preflight no aprueba código ni inicia o autoriza QA, Seguridad final, DoF o cierre.

## Revalidación v17 — retención de auditoría (2026-08-05)

### Estado e identidad

| Campo | Valor |
|---|---|
| HU / tipo / estado | `BE-005 — Cerrar y revocar sesión` / `PREFLIGHT` / `ADVISORY` |
| Paquete | `docs/handoffs/governance/BE-005-context-package.md`, revisión `v17` |
| Candidato | `a40a44735715b7557c3e57671351dd6b6ef97ed7`; staging verificado vacío |
| Delta | `JdbcAuditEntryStore`, V13 de funciones de purga y `AuditEntryMigrationTest` |

El delta afecta la retención de auditoría y no es una aprobación de código. Las salidas de v16 no se reutilizan como estado de fase para `a40a447`.

### Matriz SEC afectada

| Control | Implementación exigida | Verificación obligatoria posterior | Estado preflight |
|---|---|---|---|
| `SEC-BE005-10` | El corte y lote calculados por el caso de uso deben llegar a una función `SECURITY DEFINER`, con límite de lote y sin otorgar `DELETE` directo al escritor o purgador. | Integración Flyway V1–V13: borde exacto 365/90 días, lote máximo, orden red→entrada, segunda purga idempotente y roles de mínima autorización. | `NOT_EXECUTED` |
| `SEC-BE005-09` | La purga debe conservar la protección append-only y no permitir que parámetros del adaptador eludan el mecanismo controlado. | Confirmar que la función parametrizada valida valores y que la auditoría de logout no cambia de semántica. | `NOT_EXECUTED` |

Riesgo residual: un parámetro futuro fuera de límites no debe ampliar la retención ni otorgar borrado arbitrario; V13 debe rechazarlo. Desarrollo debe aportar implementación y prueba sobre esta identidad, QA debe ejecutar validación independiente y Seguridad final debe revisar el diff y los resultados. Este `ADVISORY` habilita sólo Desarrollo v17; no autoriza QA, Seguridad final ni DoF.

## Revalidación v19 — identidad corregida y evidencia SEC-BE005-10 (2026-08-05)

| Campo | Valor |
|---|---|
| Tipo / estado | `PREFLIGHT` / `ADVISORY` |
| Paquete | Canónico, revisión v19 |
| Candidato | `c0ddb1768bb785c0f027701848cf3ff58dfeb056`; staging vacío |
| Delta desde v17 | Sólo pruebas de `AuditEntryMigrationTest`; V13 y adaptador no cambian |

`SEC-BE005-10` exige y recibe evidencia dirigida para límites de corte/lote, mínimo privilegio, upgrade V12→V13 y exclusión de doble conteo con dos purgadores. `SEC-BE005-09` se conserva como regresión de append-only. Esta fase no aprueba código: habilita únicamente la revalidación de Desarrollo y QA v19 sobre la misma identidad; no autoriza Seguridad final ni DoF.

## Revalidación v20 — SQLState verificable

`ADVISORY` — candidato `294a0e09473fba68ce88dcaaddd1d29fcc47bab0`, paquete v20 y staging vacío. Sólo cambia la prueba: cada guardia V13 debe devolver `P0001` y cada denegación de funciones a `PUBLIC`/`audit_writer`, `42501`. Habilita únicamente Desarrollo/QA v20 para `SEC-BE005-10`; no Seguridad final ni DoF.
