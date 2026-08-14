# Handoff QA Mobile — MOB-027

## Estado

`PASS`

Candidate-ID: `4555cda + e32507696317` (sin commit). Verificado: `HEAD` es
`4555cda`; el estado conserva los cinco archivos Mobile del candidato y sus
artefactos de handoff, sin deriva de producción observada. `git diff --check`:
PASS.

## Matriz criterio → implementación → prueba → evidencia

| Criterio | Implementación | Prueba | Evidencia |
|---|---|---|---|
| Secretos y ámbito seguro | `AuthSecureStore` usa `flutter_secure_storage`, ámbito canónico y migración segura. | `auth_secure_store_test.dart` | Identidad, segregación, migración y fallo de storage: PASS. |
| A offline → B → reconexión | `clearForLogout()` serializa A en `auth.pending.logout.tickets`; `replaceSession()` no borra un ámbito pendiente. | Casos A/B en store y coordinator. | A persiste tras B; el retry envía únicamente `ticket-a`, sin refresh/ticket B: PASS. |
| 204 selectivo / no-204 | `retryPendingLogout()` elimina cada entrada solo tras respuesta verdadera/204. | Casos A/C y no-204. | 204 elimina solo A y conserva B/C; no-204 retiene A: PASS. |
| Regresión logout/reintento | Logout detiene tracking, limpia `(userId, companyId)`, borra access/refresh; scheduler coalesce eventos. | `auth_session_test.dart`, `auth_session_remote_test.dart`. | Offline, reconexión, timeout, reintentos y dispose: PASS. |
| Logs seguros | No hay llamadas de logging añadidas en la superficie modificada. | Revisión de diff. | Sin exposición nueva de token, ticket, documento o coordenadas. |

## Entorno y comandos

Entorno: `mobile/followupbusiness`; Flutter local en Windows. Ambos comandos
finalizaron correctamente:

- `$env:FLUTTER_SUPPRESS_ANALYTICS='true'; C:\tools\flutter\bin\flutter.bat analyze --no-pub` — PASS, sin incidencias (4.3 s).
- `C:\tools\flutter\bin\flutter.bat test --no-pub test/auth_secure_store_test.dart test/auth_session_remote_test.dart test/auth_session_test.dart` — PASS, 19 pruebas (3.8 s).
- `git diff --check` — PASS.

## Regresión directa y riesgos

Reproducible cubierto: logout de A sin red, login de B y reconexión: se transmite
solo el ticket de A; `204` borra A exclusivamente. Con no-`204`, A permanece
pendiente y B no se lee, revoca ni pierde secretos. Riesgo residual: no hubo
prueba física de plataforma; la protección criptográfica permanece delegada a
`flutter_secure_storage`.
