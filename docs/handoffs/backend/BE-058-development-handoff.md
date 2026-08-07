# BE-058 — Remediación Backend SEC-BE058-001

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `HEAD 4568105563a17136a29e5e063b5d858658b40a52 + ci-fix 611b2b6`
- **Alcance:** cierre de `SEC-BE058-001` y remediación mínima del contexto CI afectado por `CompanyUserController`. Los controles previamente aprobados no se modificaron.

## Cambio

Se extendió `LoginValidationErrorHandler`, el advice de validación/parsing existente en identidad/acceso, a `CompanyUserController`. Su manejo ya cubría `HttpMessageNotReadableException` con HTTP 400, `application/problem+json`, tipo `urn:followupbussiness:auth:validation-failed`, título/detalle controlados, `correlationId` y cabeceras sin caché. Se preservó el handler local de `MethodArgumentNotValidException` de `CompanyUserController` y no se tocaron caso de uso, puertos, persistencia, autorización, auditoría, OpenAPI ni migraciones.

El contexto aislado de `SecurityConfigurationTest` ahora declara `CompanyUserService` como `@MockitoBean`, igual que sus dependencias de controladores ya aisladas. Esto satisface la dependencia del controlador incorporado por BE-058 sin activar infraestructura ni alterar producción.

## Evidencia

- `patchWithMalformedJsonContainingLiteralCrLfReturnsSafeProblemDetailBeforeTheUseCase`: JSON realmente malformado por CR literal retorna 400 Problem Detail, contiene estructura/tipo/título/estado/detalle/correlationId controlados y no contiene email ni el mensaje interno de Jackson; `verifyNoInteractions(service)` demuestra que no alcanza el caso de uso ni sus puertos.
- `patchWithEscapedCrLfReachesValidationAndReturnsSafeProblemDetailBeforeTheUseCase`: JSON válido con `\\r`/`\\n` escapados se deserializa, Bean Validation lo rechaza y devuelve 400 Problem Detail; no refleja el email y tampoco alcanza el caso de uso ni sus puertos.

## Archivos, contratos y migraciones

- Producción: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LoginValidationErrorHandler.java`.
- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/CompanyUserControllerTest.java`; `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfigurationTest.java`.
- Contratos y migraciones: sin cambios.

## Verificación

- `mvn -q "-Dtest=CompanyUserServiceTest,CompanyUserControllerTest" test` — PASS.
- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" -Dtest=SecurityConfigurationTest test` — PASS (18 s); reproduce el fallo CI y confirma el contexto completo.
- `git diff --check` — PASS.
- `graphify update .` — PASS.

## Riesgo y reproducción

Riesgo residual bajo: el advice reutiliza el tipo genérico de validación del módulo de identidad/acceso. Para reproducir, enviar PATCH `/company/users/{id}` con email que contenga CR literal dentro del JSON o con `\\r`/`\\n` JSON escapados: ambos retornan 400 `application/problem+json`, sin eco de PII/payload y sin invocar el caso de uso.
