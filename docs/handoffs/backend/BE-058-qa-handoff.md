# BE-058 — QA Backend (revalidación terminal)

- **Estado:** `PASS`
- **Candidate-ID:** `HEAD 79870ec + be058-sec-remediation 31edbcca7cd1` — `HEAD` validado: `79870ec898495c34cb26cf253bb3884c33226186`; firma rápida congruente con el handoff de Desarrollo y el delta declarado (`LoginValidationErrorHandler`, `CompanyUserControllerTest`).
- **Alcance:** cierre exclusivo de `SEC-BE058-001`. No se reabrieron los controles reutilizados.

## Matriz resumida

| Criterio | Implementación | Prueba/evidencia | Resultado |
|---|---|---|---|
| JSON malformado con CR/LF literal | `LoginValidationErrorHandler` se aplica también a `CompanyUserController` y maneja `HttpMessageNotReadableException` | `patchWithMalformedJsonContainingLiteralCrLfReturnsSafeProblemDetailBeforeTheUseCase`: 400, `application/problem+json`, Problem Detail controlado, sin email ni mensaje de Jackson, `verifyNoInteractions(service)` | PASS |
| JSON válido con `\\r`/`\\n` escapado | Bean Validation del PATCH; se conserva el handler local de validación del controlador | `patchWithEscapedCrLfReachesValidationAndReturnsSafeProblemDetailBeforeTheUseCase`: 400, `application/problem+json`, Problem Detail controlado, sin email, `verifyNoInteractions(service)` | PASS |
| Alcance del advice y regresión web directa | `assignableTypes` limita el advice a login y `CompanyUserController`; no se modificaron otros handlers | `idRoutesBindTheOpenApiUserIdVariableAndReachTheUseCase` conserva GET/PATCH/status exitosos | PASS |
| `SEC-BE058-002` | Sin delta | Estado reutilizado | PASS |

## Evidencia

- JSON malformado: produce `HttpMessageNotReadableException` manejada con 400 y `application/problem+json`; el cuerpo no refleja email, payload, detalle interno de Jackson ni stack trace, y no invoca el caso de uso.
- JSON válido con CR/LF escapado: se deserializa y Bean Validation lo rechaza con 400 y `application/problem+json`; el cuerpo no refleja PII ni el valor inválido y no invoca el caso de uso.
- `mvn -q "-Dtest=CompanyUserServiceTest,CompanyUserControllerTest" test` — PASS.
- `git diff --check` — PASS (solo avisos de normalización LF/CRLF, sin errores).

## Hallazgos abiertos

Ninguno.

## Regresión relevante y riesgos residuales

- `SEC-BE058-001`: `PASS` terminal.
- `SEC-BE058-002`: `PASS` reutilizado.
- Riesgo residual bajo: ninguno atribuible al delta web revisado.

Ruta: `docs/handoffs/backend/BE-058-qa-handoff.md`.
