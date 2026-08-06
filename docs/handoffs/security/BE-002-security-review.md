# BE-002 — Revisión final de Seguridad

- Estado: `PASS`
- Candidate-ID validado: `BE002-CAND-4308ce97d4f8-97fa9577e04d`
- Gate: Desarrollo `READY_FOR_HANDOFF`; QA afectado `PASS`; `SEC-BE002-001`
  desde QA `PASS`; cero hallazgos QA abiertos.
- Firma rápida: `HEAD` conserva `4308ce97d4f8`; los ocho archivos funcionales
  no seguidos de BE-002 declarados por QA permanecen presentes en
  `git status --porcelain`, incluidos servicio/comando/puertos/store, `V22` y
  las dos pruebas focales. Dev y QA declaran el mismo Candidate-ID esperado.
- Severidad máxima abierta: ninguna.
- DoF: **autorizado** para este candidato; Seguridad no invoca DoF.

## Superficie revisada

- Delta de `SEC-BE002-001`: entrada/API `reason`, transformación en
  `ChangeCompanyStatusService`, comando y dominio de auditoría, y sink durable
  `audit_entry.reason` mediante `RecordPlatformCompanyAudit` y
  `JdbcAuditEntryStore`.
- Evidencia focal de auditoría estructurada y del no-op `200` sin escritura ni
  auditoría de cambio.
- Refresh, autorización, aislamiento tenant y `409` se reutilizaron de los
  controles ya aprobados y no se reanalizaron.

## Modelo de riesgo focal

- Activos: datos personales y secretos introducidos en `reason`, evidencia
  durable de auditoría y trazabilidad de la transición de empresa.
- Actores: `PLATFORM_SUPERADMIN` autorizado que introduce texto sensible de
  forma accidental o deliberada, y operadores con acceso posterior a auditoría.
- Límites de confianza: body HTTP no confiable hacia comando/aplicación;
  aplicación hacia el comando de auditoría y PostgreSQL.
- Abuso revalidado: enviar email, token, bearer, secreto, texto común o texto
  arbitrario como motivo e intentar recuperarlo literalmente desde
  `audit_entry.reason`; también provocar un no-op para crear evidencia de cambio
  falsa.

## Evidencia y controles

| Control | Evidencia | Estado |
| --- | --- | --- |
| `reason` permanece en la entrada/API | `ChangeCompanyStatusRequest` conserva `@NotBlank`/`@Size(5..500)` y el controlador crea `ChangeCompanyStatusCommand` con `request.reason()`; no hubo cambio de contrato. | `PASS` |
| Texto libre no alcanza un sink durable BE-002 | `ChangeCompanyStatusService.reasonProvided` ignora el contenido recibido y devuelve exclusivamente `REASON_PROVIDED`; la búsqueda focal de usos de `reason` muestra que el único recorrido durable de BE-002 es comando de auditoría → `AuditEntry.reason` → `JdbcAuditEntryStore` → `audit_entry.reason`. | `PASS` |
| Email, token, bearer, secreto y textos común/arbitrario no se persisten literalmente | `ChangeCompanyStatusServiceTest.transitionsAuditOnlyReasonPresenceForAnyCallerSuppliedText` cubre `Operational review`, email, token, bearer, API key/secreto y texto arbitrario, y exige el marcador fijo distinto del input. `CompanyStatusTransactionTest.transitionPersistsOnlyReasonPresenceAndStructuredAuditWhileRepeatedStatusIsAWriteFreeNoOp` exige `REASON_PROVIDED` en PostgreSQL ante un payload combinado. | `PASS` |
| Auditoría estructurada sin PII | El servicio solo emite actor confiable desde contexto, empresa por UUID, acción `CRITICAL_MUTATION`, resultado `SUCCESS`, estados `ACTIVE|SUSPENDED` y el marcador fijo. La prueba de integración declarada por Dev verifica `actor_id`, `resource_id`, acción, resultado, antes/después y razón fija. | `PASS` |
| No-op `200` sin auditoría falsa | El servicio llama auditoría únicamente cuando `transition.changed()`; la prueba unitaria confirma cero escritura y comando de auditoría nulo, y la integración Dev confirma versión/`updated_at` estables y una sola entrada tras repetir el estado. | `PASS` |
| Refresh, autorización y tenant | Evidencia previamente aprobada para el mismo alcance; no afectada por la remediación. | `PASS` reutilizado |
| `409` | Definido como fuera del MVP BE-002 por paquete y QA. | `NOT_APPLICABLE` reutilizado |

## Estado de SEC-BE002-001

`PASS — CERRADO`. El abuso anterior ya no es reproducible: ningún valor libre
del llamador se entrega al comando de auditoría. `audit_entry.reason` recibe
únicamente `REASON_PROVIDED` en una transición real. No quedan hallazgos abiertos.

## Ejecución y evidencia reutilizada

- Dev, mismo Candidate-ID: suite dirigida de servicio, transacción,
  controlador y refresh `PASS`; incluye persistencia estructurada y no-op.
- QA, mismo Candidate-ID: unidad/controlador `PASS`; integración PostgreSQL
  local `NOT_EXECUTED` solo por Docker no disponible. Se reutiliza el `PASS` de
  Desarrollo y no existe contradicción que lo invalide.
- Prueba adicional de Seguridad: `NOT_EXECUTED`; la inspección del delta y la
  evidencia Dev/QA resuelven el único abuso capaz de cambiar el dictamen.
- `git diff --check`: `PASS`.

## Controles no aplicables y riesgo residual

- `NOT_APPLICABLE`: ubicación, almacenamiento local, WebSocket, cache/Redis,
  mensajería, archivos, pagos, dependencias e infraestructura; la remediación no
  modifica esas superficies.
- Riesgo residual aceptable: el texto libre existe transitoriamente en memoria
  durante validación y ejecución del request, pero en el flujo BE-002 revisado
  no alcanza persistencia ni logging/publicación. La integración PostgreSQL no
  se reprodujo en QA por indisponibilidad local de Docker, con evidencia Dev
  `PASS` del mismo candidato.
