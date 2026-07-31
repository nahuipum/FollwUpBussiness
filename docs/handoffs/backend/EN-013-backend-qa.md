# QA Backend — EN-013 (retest final CORS y aceptación ADR)

## Estado

`PASS`

Retest independiente del worktree declarado sobre
`50c02f89e5907a10b2ec78f0a41a9a392db8595f`. Huellas finales verificadas:
ADR-008
`D41A81A8A144A235011A6006C1043EFBD7541A11C419BD91CCD0FF13D96A5D54`, OpenAPI
`AB1265F81658F3B4FEAC6C810CF2025AD29AD5A4D18965A5D3B35DF9DE911D46` y prueba
`3CC845BA95255CD6A6EE944AC707E0B9E6092072B567C85D43B846CF3D2BECB3`.

## Matriz criterio → implementación → prueba → evidencia

| Criterio | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| Credenciales, rotación, revocación y tenant | JWT RS256 10 min; refresh opaco/familia 30 días, CAS, revocación por reuse y relaciones persistidas como autoridad. | Prueba contractual; ADR-008 y OpenAPI. | PASS |
| Primer acceso y recuperación | `INVITED`, sin registro/password por defecto; recovery acepta solicitud genérica antes de resolver cuenta; reset HMAC/un uso/30 min. | Pruebas contractuales; ADR/OpenAPI. Timing runtime: NOT_EXECUTED. | PASS (contrato) |
| WEB/MOBILE y anti-downgrade | Cookie WEB HttpOnly+CSRF; MOBILE sin contexto navegador; Origin/Sec-Fetch no puede degradar canal. | Pruebas de schema/downgrade; OpenAPI. | PASS |
| SEC-001/002/003/005 | Rate canónico; PostgreSQL autoritativo y tombstones Redis; recovery desacoplado; `PASSWORD_POLICY_VIOLATION` en 422. | Prueba 7/7, ADR/OpenAPI y lint. | PASS (contrato) |
| SEC-004 WEB pendiente | WEB borra estado JS, no borra cookie HttpOnly; reintenta solo cookie + Origin exacto + `X-Logout-Intent: PENDING`, sin emitir credenciales/datos ni permitir `allSessions`. | ADR-008 §§ CSRF/CORS y Logout; `/auth/logout`; prueba offline logout. | PASS |
| SEC-004 CORS acotado | `X-Logout-Intent` se permite en preflight únicamente para Origin exacto aprobado y `POST /auth/logout`; no hay comodín ni exposición de `Set-Cookie`. | ADR-008 § CORS; descripción/parametro OpenAPI de logout; prueba offline logout. | PASS |
| SEC-004 MOBILE pendiente | Borra access/refresh; solo persiste ticket opaco one-use, family-bound, no autenticante ni renovable. | ADR, schema `MobileAuthenticationResponse`, security scheme y prueba offline logout. | PASS (contrato) |
| Aceptación administrativa | ADR en estado `Aceptado`; Decisión A, Luis Siancas — Owner, fecha 2026-07-31 (America/Lima); habilita consumo sin aprobar/iniciar EN-017 ni sustituir validaciones implementadoras. | Delta ADR y sección `Aceptación`; hashes OpenAPI/prueba inmutables. | PASS |

## Comandos y evidencia

| Acción | Resultado |
|---|---|
| `Get-FileHash` ADR/OpenAPI/prueba y contraste con handoff | Las tres huellas coinciden con el snapshot de remediación. |
| `mvn "-Dtest=AuthenticationContractPolicyTest" test` (JDK 21.0.9) | PASS: 7 pruebas, 0 fallos, 0 errores, 0 omitidas. |
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` | PASS: OpenAPI válido, sin errores/warnings. |
| `git diff --check` | PASS; solo avisos LF→CRLF del host, sin errores de whitespace. |
| Revalidación mínima del delta de aceptación | PASS: solo cambia estado y bloque administrativo del ADR; no cambian OpenAPI ni prueba. Se reutilizan 7/7 y lint del mismo hash de esos materiales. |

## Hallazgos

No hay hallazgos abiertos reproducibles en el alcance documental/contractual.
El hallazgo QA previo sobre el preflight CORS queda resuelto por la restricción
explícita de header, Origin y método.

## Regresión relevante y riesgos residuales

- El contrato y su prueba focalizada son consistentes; lint no sustituye una prueba de navegador real.
- La aceptación humana no modifica reglas de autenticación ni el alcance de EN-017.
- No existen endpoints, migraciones, Redis ni clientes: CORS real, ticket one-use, timeout/reinicio, limpieza offline y carreras DB↔Redis son `NOT_EXECUTED` hasta BE-003..006/FE-003/MOB-002.
- La remediación aún está fuera del commit `50c02f89`; debe conservarse en un snapshot inmutable antes de DoF/Seguridad. Este PASS no sustituye su retest ni la consumibilidad Frontend/Mobile.

PASS
