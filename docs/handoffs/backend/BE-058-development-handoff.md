# BE-058 — Remediación Backend SEC-BE058-001

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `HEAD 79870ec + be058-sec-remediation 31edbcca7cd1`
- **Alcance:** únicamente el cierre de `SEC-BE058-001`: Problem Detail seguro para parsing JSON en PATCH de usuarios de empresa. Los controles previamente aprobados no se modificaron.

## Cambio

Se extendió `LoginValidationErrorHandler`, el advice de validación/parsing existente en identidad/acceso, a `CompanyUserController`. Su manejo ya cubría `HttpMessageNotReadableException` con HTTP 400, `application/problem+json`, tipo `urn:followupbussiness:auth:validation-failed`, título/detalle controlados, `correlationId` y cabeceras sin caché. Se preservó el handler local de `MethodArgumentNotValidException` de `CompanyUserController` y no se tocaron caso de uso, puertos, persistencia, autorización, auditoría, OpenAPI ni migraciones.

## Evidencia

- `patchWithMalformedJsonContainingLiteralCrLfReturnsSafeProblemDetailBeforeTheUseCase`: JSON realmente malformado por CR literal retorna 400 Problem Detail, contiene estructura/tipo/título/estado/detalle/correlationId controlados y no contiene email ni el mensaje interno de Jackson; `verifyNoInteractions(service)` demuestra que no alcanza el caso de uso ni sus puertos.
- `patchWithEscapedCrLfReachesValidationAndReturnsSafeProblemDetailBeforeTheUseCase`: JSON válido con `\\r`/`\\n` escapados se deserializa, Bean Validation lo rechaza y devuelve 400 Problem Detail; no refleja el email y tampoco alcanza el caso de uso ni sus puertos.

## Archivos, contratos y migraciones

- Producción: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LoginValidationErrorHandler.java`.
- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/CompanyUserControllerTest.java`.
- Contratos y migraciones: sin cambios.

## Verificación

- `mvn -q "-Dtest=CompanyUserServiceTest,CompanyUserControllerTest" test` — PASS.
- `git diff --check` — PASS.
- `graphify update .` — PASS.

## Riesgo y reproducción

Riesgo residual bajo: el advice reutiliza el tipo genérico de validación del módulo de identidad/acceso. Para reproducir, enviar PATCH `/company/users/{id}` con email que contenga CR literal dentro del JSON o con `\\r`/`\\n` JSON escapados: ambos retornan 400 `application/problem+json`, sin eco de PII/payload y sin invocar el caso de uso.
