# Security review — BE-056

## Estado

`PASS` — vigente para el paquete v3 y el candidato
`2ad78920b3b0178d44bc5379d5d1b5c26ff5f131`. El `BLOCKED` descrito en la
revisión histórica quedó cerrado por la reevaluación v3 al final de este
documento.

## Snapshot y superficie revisada

- Rama: `feature/be-056-dlq`, diff de BE-056 aún sin commit.
- Superficie: DLQ durable PostgreSQL, transición/retención SQL, endpoint interno
  de reproceso, Spring Security, RabbitMQ, métricas/alertas y OpenAPI.
- Gates previos: Desarrollo `READY_FOR_HANDOFF`; QA independiente `PASS` en
  `docs/handoffs/backend/BE-056-backend-qa.md`.

## Hallazgos

| ID | Severidad | Estado | Evidencia y escenario de abuso | Remediación |
|---|---|---|---|---|
| SEC-BE056-01 | High si el endpoint se habilita sin cerrar la frontera | BLOCKED | `SecurityConfiguration` solo consume un `Authentication`; no hay filtro/provider/conversor JWT ni resource server. Las pruebas usan principal y rol sintéticos. Hoy el endpoint falla cerrado para tráfico real, pero no hay evidencia de que un `PLATFORM_SUPERADMIN` real tenga firma, sesión activa, `sub` UUID y autoridad persistida válidos. Al incorporar autenticación sin prueba integrada, un rol mal mapeado o principal no confiable podría reencolar eventos de cualquier tenant. | Mantener el endpoint no liberado hasta BE-003/adaptador Auth runtime. Añadir prueba integrada con el mecanismo aprobado: firma/sesión activa, `sub` UUID, rol exacto, y rechazo de rol/tenant manipulados. |
| SEC-BE056-02 | Medium | OPEN | El límite de tres acciones es por `eventId`; no hay límite por operador/origen. Con una sesión privilegiada comprometida se pueden emitir solicitudes masivas contra PostgreSQL o reencolar muchos eventos. | Rate limit distribuido por operador/origen, respuesta 429, presupuesto operativo y prueba de abuso. |
| SEC-BE056-03 | Medium | OPEN | La DLQ guarda solo el último operador/instante; una acción posterior sobrescribe la atribución y no existe auditoría append-only por reproceso. | Auditoría append-only por acción: `eventId`, operador técnico, instante y resultado, sin payload/PII. |

## Controles verificados

- El cliente no aporta tenant, payload, correlationId ni identidad de operador;
  la DLQ conserva tenant y correlación desde la fila durable.
- Path UUID parametrizado, rol exacto requerido, usuarios de tenant sin acceso;
  no se observa BOLA en la frontera propuesta.
- CTE, FK, leases, límite de ocho intentos, máximo tres reprocesos y reingreso a
  DLQ preservan semántica al menos una vez y no forman bucle automático.
- Error permanente/no enrutable llega a DLQ; transitorio tiene backoff limitado.
- Logs y métricas no contienen payload ni PII; alertas de profundidad/edad DLQ
  existen. Secretos Rabbit se obtienen por entorno; puertos siguen restringidos.

## Verificaciones y limitaciones

- `SecurityConfigurationTest`: PASS (30 pruebas con principal sintético).
- `git diff --check`: PASS.
- Evidencia QA del mismo snapshot reutilizada: PostgreSQL/Testcontainers,
  promtool, ciclo de reproceso y arquitectura en PASS.
- RabbitMQ least-privilege runtime y autenticación real: `NOT_EXECUTED`; no hay
  cambio de dependencias ni de credenciales en BE-056.

## Riesgo residual y condición de desbloqueo

No hay bypass reproducible mientras el endpoint permanezca fail-closed. No
obstante, BE-056 no puede declarar operación de operador ni pasar DoF hasta que
BE-003 provea una identidad runtime verificable y se cierren SEC-BE056-02 y
SEC-BE056-03. La alternativa de relajar el endpoint o confiar en datos del
cliente queda rechazada por aislamiento multiempresa y ADR-010.

---

## Reevaluación Security — trazabilidad v3

### Estado

`PASS`

Los hallazgos `SEC-BE056-01`, `SEC-BE056-02` y `SEC-BE056-03` están cerrados
para el candidato fijo
`2ad78920b3b0178d44bc5379d5d1b5c26ff5f131` y el paquete de contexto
`docs/handoffs/governance/BE-056-gestionar-reintentos-y-dlq.md` v3. Desarrollo
está `READY_FOR_HANDOFF` y QA v3 está `PASS`. No hubo cambio funcional posterior
a las remediaciones: el contenido posterior es trazabilidad, nomenclatura,
formato y orquestación.

### Triage y superficie revisada

La revisión aplica porque el cambio toca superficies de seguridad: endpoint
privilegiado, autenticación/autorización, Redis como control de abuso, datos
multiempresa en DLQ, auditoría y una carrera entre reproceso y retención.

- Superficie incluida: filtro Bearer/JWT, validación de sesión/cuenta/rol,
  `SecurityFilterChain`, controlador de reproceso, rate limit por operador y
  origen, transición PostgreSQL, auditoría append-only y retención concurrente.
- Activos: identidad y sesión del superadministrador, eventos DLQ y su tenant
  durable, disponibilidad de PostgreSQL/Redis y trazabilidad del operador.
- Actores: `PLATFORM_SUPERADMIN` legítimo, atacante con token manipulado o
  revocado, operador privilegiado abusivo y proceso de retención.
- Límites de confianza: HTTP → filtro JWT/Spring Security → controlador;
  controlador → Redis; autenticador y caso de uso → PostgreSQL; reproceso →
  transacción/lock compartido con retención.

### Hallazgos reevaluados

| ID | Severidad original | Resultado | Evidencia verificable y abuso reproducible |
|---|---|---|---|
| `SEC-BE056-01` | High | `PASS` / cerrado | El filtro exige Bearer en la ruta; el autenticador valida RS256, firma, `iss`, `aud`, expiración, `sub` y `sid` UUID, rol único `PLATFORM_SUPERADMIN`, ausencia de `tid` y sesión/cuenta/rol activos en PostgreSQL con `company_id IS NULL`. La cadena exige la autoridad y el controlador vuelve a validar rol y UUID. Abuso: firma alterada, sesión revocada/inactiva, `tid`, rol distinto o `sub` no UUID termina en 401/403 y no alcanza el reproceso. Evidencia reutilizada: pruebas de autenticador/configuración y `mvn clean verify` PASS en `d83b166…`; CI exacta del candidato PASS. |
| `SEC-BE056-02` | Medium | `PASS` / cerrado | Redis aplica `INCR`+`EXPIRE` atómico en ventanas de 60 s: 20 solicitudes por operador y 60 por origen. Las claves usan HMAC y no conservan operador/origen en claro; exceso devuelve 429 con `Retry-After`, y ausencia/fallo del limitador devuelve 503. Abuso: superar la cuota con una sesión privilegiada válida no invoca el caso de uso; una caída de Redis falla cerrada. Evidencia reutilizada: pruebas del limitador y de la frontera HTTP, `clean verify` PASS y CI exacta PASS. |
| `SEC-BE056-03` | Medium | `PASS` / cerrado | Cada reproceso elegible inserta una fila en `transactional_outbox_dlq_reprocess_audit` dentro de la misma sentencia que actualiza DLQ y reencola; conserva operador, instante y resultado sin payload. Reproceso y retención toman el mismo advisory lock determinista por `event_id`, y la retención revalida estado/fechas después del lock. Abuso: ejecutar reproceso y purga simultáneos sobre una DLQ antigua serializa ambas operaciones; la prueba confirma que el reproceso gana, la purga devuelve cero y permanecen contador/auditoría; el cuarto reproceso se rechaza. `TransactionalOutboxMigrationTest`: 11 PASS con PostgreSQL 17/Testcontainers/Docker. |

No quedan hallazgos `FAIL` abiertos en el alcance reevaluado.

### Evidencia reutilizada y estado de ejecución

- `PASS`: `TransactionalOutboxMigrationTest`, 11 pruebas con PostgreSQL 17 en
  Docker, incluida la carrera retención/reproceso.
- `PASS`: `mvn clean verify` local en `d83b166…`, contenido funcional previo a
  los cambios no funcionales posteriores.
- `PASS`: CI del candidato exacto `2ad7892…`: EN-010 PR ejecución
  `30931035614`, EN-011 PR reejecución `30931035880` y EN-011 push ejecución
  `30931031812`.
- `NOT_EXECUTED`: no se repitieron suites, SAST/SCA ni escaneos generales porque
  el paquete v3 fija el candidato, QA ya aportó evidencia del mismo SHA y el diff
  no cambia dependencias ni la semántica funcional revisada.
- `NOT_EXECUTED`: consulta `graphify`; `graphify-out/graph.json` existe, pero el
  CLI no está disponible en el entorno. No se usó como evidencia.

### Excepciones, controles no aplicables y riesgos residuales

- Excepciones de lectura: ninguna. No se releyó historia, contrato funcional,
  ADR, OpenAPI, contrato de eventos ni otra fuente primaria; se utilizó el
  paquete v3, los handoffs Dev/QA y únicamente controles de seguridad vinculados
  a los tres riesgos.
- `NOT_APPLICABLE`: WebSocket, geolocalización, archivos, almacenamiento local,
  cache de datos de negocio, cambios RabbitMQ, nuevos secretos y dependencias;
  estas superficies no cambian en la reevaluación.
- Riesgos residuales aceptados: la operación debe proteger la clave RSA, el
  secreto HMAC y los accesos a PostgreSQL/Redis; la auditoría se elimina por
  cascada al vencer la retención DLQ de 30 días; y el despliegue debe mantener
  una semántica confiable para `remoteAddr` si existe un proxy. Ninguno constituye
  un hallazgo nuevo ni reabre los tres controles verificados.
