# Revisión final de Ciberseguridad — BE-005

## Estado y candidato

`BLOCKED`.

- `HEAD`: `3a787569ca873f084e0b6f0e052988933935cda7`.
- Diff tracked: `a587d7bdebced0aa6d5c8d5219f3f0df59fe7adc`, coincidente con QA; `git diff --check HEAD`: `PASS`.
- Evidencia reutilizada: QA 20/20 y Desarrollo integración 4/4. `SecurityConfigurationTest`: 30 pruebas, 3 fallos; uno revela la ruta de logout sin filtro Bearer, dos son expectativas antiguas de media type.
- No hubo relectura de HU, ADR, OpenAPI ni contrato funcional. No se modificó código en esta revisión.

## Hallazgos

| ID | Severidad | Controles | Evidencia y abuso | Remediación |
|---|---|---|---|---|
| CY-BE005-01 | Alta | SEC-01, 03, 06 | `SecurityConfiguration` deja `/auth/logout` `permitAll` y el filtro JWT sólo actúa en DLQ; logout normal recibe actor nulo. PENDING admite `Authorization` mezclado. | Autenticar Bearer exclusivamente en normal; PENDING público rechaza `Authorization` y mezcla de credenciales; MockMvc con cadena real. |
| CY-BE005-02 | Media | CA-01, SEC-06 | `LogoutSessionService` rechaza familia ya revocada; reintento current devuelve 401, no 204 neutral. | Ingreso y aplicación deben responder 204 idempotente sin secreto/estado; probar primera llamada, pérdida y repetición. |
| CY-BE005-03 | Media | CA-04, SEC-09, 04 | El rechazo se lanza antes de `audit.record`; un fallo de auditoría después del UPDATE puede revertir revocación. | Auditar éxito/denegación/error con mínimo técnico y asegurar que auditoría indisponible no deshaga revocación durable; prueba transaccional. |
| CY-BE005-04 | Media | SEC-07 | `RedisLogoutAbuseMonitor` incrementa/TTL pero no aplica 5/h, alerta/backoff ni se limita a global. | Aplicar 5/h sólo a global, siempre procesando revocación, sin 429/503; probar sexta llamada y Redis caído. |
| CY-BE005-05 | Alta, externo | SEC-12 | `notifications` y `tracking` sólo tienen `package-info`; no hay puerto público para desvincular MOBILE/cerrar presencia. | Producto/Arquitectura debe definir contrato y ADR si cambia límites. No acoplar tablas internas. |

## Matriz SEC

| Control | Resultado |
|---|---|
| 01 | FAIL — Bearer no cableado al logout normal |
| 02 | NOT_EXECUTED — falta matriz integral de roles/recursos/tenants |
| 03 | FAIL — PENDING admite Authorization mezclado |
| 04 | FAIL — auditoría puede revertir revocación; Redis stale no probado |
| 05 | NOT_EXECUTED — carrera refresh/logout no cubierta |
| 06 | FAIL — current no idempotente |
| 07 | FAIL — semántica 5/h ausente |
| 08 | PASS por inspección — problemas neutrales, no-store y correlación |
| 09 | FAIL — denegaciones/fallos sin auditoría |
| 10 | PASS por inspección — append-only y retención 365/90 reutilizados |
| 11 | NOT_EXECUTED — falta prueba dos tenants/Redis stale |
| 12 | FAIL/BLOCKED — contrato/puerto inexistente |

## Ruta limitada

Remediar sólo SEC-BE005-01, 03, 04, 05, 06, 07, 09, 11 y 12 con `Dev → QA afectado → Seguridad final → DoF`. La ausencia del contrato de SEC-12 exige dirección de Producto/Arquitectura; no puede sustituirse con acceso a tablas internas.

## Seguridad final v3

`BLOCKED` sobre `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`, diff tracked `e8dcefa3429d97438453a700dbf0161565e504f7`; QA v3 reutilizable: 48 pruebas PASS (cuatro integración PostgreSQL/Flyway). La autenticación Bearer normal y el rechazo de mezcla PENDING quedaron resueltos.

Persisten: SEC-06 reintento HTTP current 401 porque el autenticador exige `revoked_at IS NULL`; SEC-09 no audita denegaciones previas a `audit.record`; SEC-07 no aplica umbral/efecto 5/h y monitorea también current/pending; SEC-05 carrera refresh/logout no ejecutada; SEC-11 dos tenants/Redis stale no ejecutados; SEC-12 `FAIL/BLOCKED` por puerto de presencia-notificaciones inexistente. Los archivos nuevos BE-005 aún no están incluidos en la huella tracked; snapshot auxiliar `aed58500f7ccd3ef868b750d4e213d04f403edf4`. Se requiere remediación limitada y fijar un manifiesto candidato antes de reusar evidencia.

## Revisión final v14 — H-03 (2026-08-05)

### Estado

`BLOCKED`

### Identidad y entradas

- HU: `BE-005 — Cerrar y revocar sesión`; tipo: `FINAL`.
- Paquete: `docs/handoffs/governance/BE-005-context-package.md`, revisión `v14`, SHA-256 `541CEB8A1B1D1AD3D81524795DAD17D326E9547C5BDD1E4A3E7083D2D05178AA`.
- Candidato declarado: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7` + diff tracked `b5ddac5b7fd730a248cca12e293984daf69e540f`; staging vacío.
- Desarrollo: «Revalidación v14 — evidencia H-03 completada», `READY_FOR_HANDOFF`; QA: «QA independiente v14 — H-03», `PASS`; preflight: «Revalidación v14 — evidencia de cierre H-03», `ADVISORY`.
- Alcance: H-03 y `SEC-BE005-03,04,05,06,08,09,11,12`. `SEC-BE005-01,02,07,10` están fuera del delta y no se reutiliza `PASS` alguno.

### Matriz SEC

| Control | Resultado | Evidencia |
|---|---|---|
| `SEC-BE005-03` | `PASS` en snapshot | SQL exige `MOBILE`; QA cubre ticket WEB y modalidades HTTP. |
| `SEC-BE005-04`, `05`, `06`, `09`, `11` | `FAIL` | F14-02: un digest duplicado actualiza varias familias y sólo una se revoca/audita. |
| `SEC-BE005-08` | `PASS` por inspección | Rechazo sin mensaje, sin logger/métrica en el flujo, ticket reducido a HMAC, auditoría sin ticket/digest; QA cubre respuesta neutral. |
| `SEC-BE005-12` | `PASS` en snapshot | Puerto con familia/tenant derivados; QA cubre rollback y replay. |

Los resultados técnicos no eliminan F14-01: la identidad declarada no enlaza todos los archivos críticos del snapshot.

### Hallazgos

#### F14-01 — Archivos críticos fuera de la huella candidata

- Severidad: `HIGH`; estado: `OPEN`.
- La huella `git diff HEAD` es `b5ddac5b7fd730a248cca12e293984daf69e540f`, pero no incluye archivos untracked críticos: `LogoutSessionService.java` (SHA-256 `93FC9A1442F8B42920D9B791798388B5FF8F73847F47916FB313803FE987DA40`), `LogoutController.java` (`49459420C8428A36F6E47FEB5686A8A6B716C8E9837F681513AC8B19E8003A8E`), sus pruebas, el adaptador de instalaciones y V11.
- El paquete v14 no contiene un manifiesto completo ruta/estado/SHA-256. Alterar esos archivos no modifica la huella declarada, por lo que evidencia y código liberable no quedan ligados inmutablemente.
- Remediación: incluir los archivos en Git o fijar en el paquete canónico un manifiesto reproducible completo; emitir una nueva revisión y revalidar Desarrollo, QA y Seguridad.

#### F14-02 — Consumo no único de digest puede cruzar tenants

- Severidad: `MEDIUM`; estado: `OPEN`; afecta `SEC-BE005-04,05,06,09,11`.
- V5 define `revocation_ticket_digest BYTEA` sin unicidad. `consumeRevocationTicket` ejecuta un `UPDATE ... RETURNING` por digest y luego conserva sólo la primera fila con `.stream().findFirst()`.
- Con dos familias `MOBILE` activas, de tenants distintos y el mismo digest, el `UPDATE` limpia ambos digests, pero servicio, instalaciones y auditoría procesan sólo una familia. La otra queda activa, sin ticket y sin auditoría: mutación cross-tenant y estado parcial durable.
- La prueba v14 usa digest distinto para el tenant ajeno y no cubre la colisión. Remediación: restricción/índice único parcial para digest no nulo, saneamiento previo, fallo cerrado ante cardinalidad distinta de uno e integración de dos tenants con digest igual y cero mutaciones.

### Evidencia y decisión

- HEAD/diff/staging, SHA del paquete y `git diff --check HEAD`: `PASS`.
- Inspección dirigida de SQL, servicio, controlador, auditoría, instalaciones, pruebas y ausencia de logger/métrica con ticket/digest: ejecutada.
- Suites Maven 19 y 12: resultado QA reutilizado, sujeto a F14-01; escaneos generales: `NOT_EXECUTED`.

`BLOCKED` — F14-01 impide demostrar un candidato inmutable y F14-02 deja controles de aislamiento/consistencia abiertos. Procede únicamente remediación acotada y nueva cadena `Desarrollo → QA afectado → Seguridad final`; no iniciar ni autorizar DoF.

## Revalidación final v16 — F14-01 y F14-02 (2026-08-05)

### Estado

`PASS`

### Identidad, entradas y alcance

- HU: `BE-005 — Cerrar y revocar sesión`; tipo: `FINAL`; paquete canónico v16 SHA-256 `2BAD5011D428290EA32C19C3E47B6882A5DEFB9EE9C7B6D6FCDF705893D4AE81`.
- Preflight v16 `ADVISORY`; Desarrollo v16 `READY_FOR_HANDOFF`; QA v16 `PASS`.
- Antes y después: `HEAD 3a787569ca873f084e0b6f0e052988933935cda7`; staging vacío; object ID de `git diff HEAD` `524f08838e6f2b4f8719bdd0bbf67309156082bd`; `git diff --check HEAD` PASS.
- F14-01: manifiesto 31/31 recalculado, con hash global `F4550469865912C84F2A85492D664E601AEEE5CA15FE301CF560D11BFC2B91D0`. Las rutas fuera del manifiesto son instrucciones, workflow, plantillas y handoffs/gobierno; no se observó otra ruta funcional BE-005 omitida.
- Alcance exclusivo: F14-01/F14-02 y `SEC-BE005-04,05,06,09,11`; sin excepción de relectura de HU, contratos o ADR.

### Matriz SEC

| Control | Resultado | Evidencia |
|---|---|---|
| F14-01 | `PASS` | Identidad y manifiesto verificables sin discrepancias. |
| `SEC-BE005-04` | `PASS` | Consumo bloquea coincidencias y actualiza sólo cardinalidad uno; QA cubre rollback MOBILE y V11 ambiguo sin mutación. |
| `SEC-BE005-05` | `PASS` | CTE `MATERIALIZED` + `FOR UPDATE`; la evidencia PostgreSQL concurrente deja un ganador. |
| `SEC-BE005-06` | `PASS` | Cero/varias coincidencias se rechazan antes de efectos; replay/concurrencia no repiten efectos. |
| `SEC-BE005-09` | `PASS` | Rollback conjunto y V11 ambiguo dejan cero auditorías; sólo el ganador registra `LOGGED_OUT`. |
| `SEC-BE005-11` | `PASS` | V12 impone unicidad global; V11 ambiguo falla cerrado y preserva ambos tenants. |

### Hallazgos, evidencia y riesgo residual

- F14-01 (`HIGH`) y F14-02 (`MEDIUM`) quedan `CLOSED`; no hay hallazgos nuevos.
- QA ejecutó `RevocationTicketIntegrityIntegrationTest` y `RefreshSessionTransactionIntegrationTest`: 14/0, PostgreSQL/Testcontainers/Flyway V12. El abuso V12 rechaza la segunda familia cross-tenant sin mutar la primera; bajo V11 dos familias ambiguas devuelven `Rejected`, preservan ambas familias/digests y dejan cero auditorías.
- La inspección confirma que `null` del consumo se rechaza antes de instalaciones y auditoría. Las suites ya evidenciadas no se repitieron; DAST/SCA y prueba contra producción no aplican al delta.
- Riesgo residual operacional: si producción contiene digest V11 no nulos duplicados, V12 falla cerrado y detiene el despliegue hasta validar/sanear datos. No hay bypass ni mutación silenciosa; el runtime legado rechaza ambigüedad sin cruce tenant.

### Decisión

`PASS` — F14-01/F14-02 están cerrados para v16 y los controles afectados tienen implementación y evidencia. Seguridad no invoca DoF.
