# BE-002 — Handoff QA Backend

- Estado: `PASS`
- Candidate-ID validado: `BE002-CAND-4308ce97d4f8-97fa9577e04d`.
- Remediación: `SEC-BE002-001` `PASS` desde QA.
- Gate: Desarrollo `READY_FOR_HANDOFF`; el Candidate-ID declarado coincide con el esperado. Firma rápida: `HEAD` mantiene prefijo `4308ce97d4f8`; `git status --porcelain` confirma presentes y estables los archivos funcionales no seguidos BE-002, incluidos `ChangeCompanyStatusService`, sus puertos/store, `V22` y las dos pruebas de estado/auditoría. El diff tracked preexistente conserva firma `cab8ed4eea4e`; no se usó como sustituto del candidato con archivos no seguidos.

## Matriz focal

| Criterio | Implementación | Prueba/evidencia | Estado |
| --- | --- | --- | --- |
| `reason` sigue aceptado sin cambio de contrato | `ChangeCompanyStatusRequest` y `ChangeCompanyStatusCommand` conservan `reason`; el controlador cubre body válido | `CompanyControllerTest.statusTransitionReturnsTheContractCompanyAndCorrelation` ejecutada | `PASS` |
| Texto libre no alcanza `audit_entry.reason` | `ChangeCompanyStatusService` transforma cualquier razón a `REASON_PROVIDED` antes de `RecordPlatformCompanyAudit`; `JdbcAuditEntryStore` persiste solo `entry.reason()` | `transitionsAuditOnlyReasonPresenceForAnyCallerSuppliedText`; prueba de integración dirigida declarada `PASS` por Dev | `PASS` |
| Email, token, bearer, secreto y texto arbitrario no se persisten literalmente | Tabla de razones de `ChangeCompanyStatusServiceTest` cubre los cinco tipos y aserta marcador fijo distinto del input | Prueba unitaria ejecutada; integración `transitionPersistsOnlyReasonPresenceAndStructuredAuditWhileRepeatedStatusIsAWriteFreeNoOp` `NOT_EXECUTED` local por Docker | `PASS` |
| Auditoría estructurada sin PII | Comando/auditoría transportan actor confiable, empresa, acción, resultado y antes/después `status`; razón fija | Prueba de integración dirigida de Dev verifica `actor_id`, `resource_id`, acción, resultado, estados y marcador | `PASS` |
| No-op `200` sin escritura ni auditoría falsa | El servicio solo audita cuando `transition.changed()` | `sameStatusIsA200ResultWithoutWriteOrChangeAudit` ejecutada; integración dirigida de Dev cubre versión, `updated_at` y una sola auditoría | `PASS` |
| Sin cambio adicional de contrato o migración | Remediación focal no modifica OpenAPI/controlador ni `V22`; sin migración adicional | Inspección de diff/estado | `PASS` |
| Refresh y `409` | Evidencia QA previa reutilizada: refresh `PASS`; `409` `NOT_APPLICABLE` para MVP | Sin repetición por alcance | `PASS` / `NOT_APPLICABLE` |

## Comandos y evidencia

- `mvn -q '-Dtest=ChangeCompanyStatusServiceTest,CompanyStatusTransactionTest,CompanyControllerTest' test`: los casos unitarios/controlador ejecutaron sin fallos; `CompanyStatusTransactionTest` quedó `NOT_EXECUTED` porque Testcontainers no puede acceder a Docker (`docker_engine` no disponible).
- `mvn -q '-Dmaven.repo.local=C:\\tmp\\followup-m2' '-Dtest=ChangeCompanyStatusServiceTest,CompanyStatusTransactionTest,CompanyControllerTest' test`: misma evidencia; habilitó dependencias locales y confirmó el bloqueo exclusivo de Docker para la integración.
- Evidencia reutilizada del handoff Dev del mismo Candidate-ID: `mvn -q '-Dtest=ChangeCompanyStatusServiceTest,CompanyStatusTransactionTest,CompanyControllerTest,RefreshServiceTest,RefreshControllerTest,RefreshRateLimiterTest' test` `PASS`.
- `git diff --check`: `PASS`.

## Hallazgos abiertos

- Ninguno.

## Regresión y riesgo residual

- Regresión directa de suspensión/reactivación y auditoría cubierta por unidad/controlador y por la ejecución de Desarrollo; refresh y `409` reutilizados según alcance.
- Riesgo residual: la persistencia PostgreSQL/Testcontainers no se reprodujo localmente por indisponibilidad de Docker; no hay indicio de defecto y la ejecución verificable de Desarrollo para el mismo Candidate-ID fue `PASS`.
