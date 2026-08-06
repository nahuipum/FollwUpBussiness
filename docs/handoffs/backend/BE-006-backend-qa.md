# QA Backend — BE-006

- Estado: `PASS`
- Candidate-ID: `b562037 + a83c1c52d3fa`. Firma rápida: adaptador, prueba de integración y handoff presentes como no rastreados; sin cambio posterior observado durante la validación.
- Alcance: revalidación terminal de notificaciones de identidad.

| Criterio/delta | Implementación | Prueba/evidencia | Resultado |
|---|---|---|---|
| Plataforma `company_id=NULL` y cardinalidad exacta | `delivered`, `retry` y `erase` usan `IS NOT DISTINCT FROM`; `requireSingleTransition` exige una sola fila. | `platformTerminalTransitionsRejectRepeatedEraseAndLateAcknowledgementOrRetry`: segunda transición lanza `IllegalStateException`. | PASS |
| Crypto-erase terminal y no reclamo | Las tres transiciones exigen `superseded_at IS NULL`; `erase` limpia ciphertext; `claimDue` excluye supersedidos. | Misma prueba: erase repetido, delivered/retry tardíos fallan y `claimDue` queda vacío. | PASS |
| Regresión tenant y lease | Predicado conserva tenant null-safe; claim fija lease de 30 s. | `tenantTransitionRejectsOtherTenantWhileLeasePreventsDuplicateClaim`: tenant ajeno falla y segundo claim durante lease está vacío. | PASS |

## Comandos/evidencia

- `mvn test "-Dtest=IdentityNotificationPersistenceIntegrationTest"` — PASS, 7/7; PostgreSQL 17, Flyway V19.
- `git diff --check` — PASS (sin errores de whitespace; avisos LF/CRLF del host no afectan el resultado).

## Hallazgos

- Sin hallazgos. Severidad: N/A.

## Regresión relevante y riesgos residuales

- La regresión directa de tenant/lease pasó en integración. HTTP/Redis y reinicio físico: `NOT_EXECUTED`, fuera de este delta; sin riesgo residual nuevo identificado.
