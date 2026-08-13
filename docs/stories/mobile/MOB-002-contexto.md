# Contexto de entrega — MOB-002

## Estado y alcance

- Estado actual: `DESARROLLO`.
- Candidate-ID: `d33a60e+f90c16f5`.
- Aplicación: `mobile/followupbusiness` (Flutter). No se permite modificar UI ni elementos visuales.
- Predecesoras declaradas: BE-004, BE-005 y MOB-001. Desarrollo debe comprobar la consumibilidad del contrato y bloquear solo si la superficie Backend necesaria no existe o contradice OpenAPI.

## Contrato estable

- `POST /auth/refresh`: cabeceras `X-Auth-Client: MOBILE` y `X-Client-Instance-Id` UUID estable; cuerpo exclusivo `{refreshToken}`. Éxito válido: `channel=MOBILE`, `credentials.accessToken`, `credentials.expiresIn`, `refreshToken`, `sessionRevocationTicket`, `refreshExpiresIn`, `user`. Cualquier canal/campo incompleto es inválido.
- `POST /auth/logout`: mismas cabeceras; con access válido usa `Authorization: Bearer`; sin red/sin access usa exclusivamente `X-Session-Revocation-Ticket`; nunca `allSessions=true`; `204` es éxito idempotente.
- Error refresh: `401 REFRESH_TOKEN_EXPIRED|REFRESH_TOKEN_INVALID|REFRESH_TOKEN_REUSED` y `409 REFRESH_ALREADY_ROTATED` fuerzan limpieza total y login; `429 AUTH_RATE_LIMITED` y `503 AUTH_RATE_LIMIT_UNAVAILABLE` son recuperables sin bucle.

## Invariantes y controles

1. Access token solo en memoria; refresh y ticket solo en secure storage. No logs, analytics, errores, UI ni persistencia convencional de secretos.
2. Rotación atómica de refresh/ticket, sin conservar un refresh anterior. Renovaciones concurrentes comparten una sola operación. Una solicitud protegida se reintenta una vez solo por `401 ACCESS_TOKEN_EXPIRED` tras refresh exitoso.
3. Logout local primero: detener tracking mediante abstracción/no-op seguro, desactivar auto-refresh, borrar access/refresh, estado y cache segregados por usuario/tenant; conservar solo ticket hasta completar revocación.
4. Fallo remoto, timeout o sin red conserva ticket pendiente y mecanismo interno de reintento; nunca restablece sesión/tokens/tracking. `204` elimina ticket.
5. Cambio de usuario o empresa no reutiliza tokens, ticket, caché ni datos cruzados.

## Evidencia requerida

- Unitarias: éxito/rotación/invalidación de respuesta; 401 de refresh, 409, 429 y 503; concurrencia; interceptor y único reintento; logout 204/offline/timeout/ticket pendiente; limpieza, no persistencia de access y ausencia de secretos en logs.
- Ejecutar `flutter analyze`, pruebas enfocadas y validación CI-equivalente del proyecto si la composición compartida cambia.

## Fuentes consultadas por Orquestador

- `docs/stories/mobile/MOB-002-renovar-y-cerrar-sesion.md`
- `docs/api/openapi.yaml` (`/auth/refresh`, `/auth/logout`, esquemas asociados)
- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md` (refresh, MOBILE y logout).

## Delta vigente de corrección QA

- Candidate-ID vigente: `d33a60e+5d1e0ea8` (HEAD `d33a60e` más digest del diff de desbloqueo QA).
- QA declaró `CHANGES_REQUIRED`: `onConnectivityRestored()` no tiene una suscripción a conectividad real. Tras agotar los reintentos offline, una reconexión no reinicia la revocación pendiente.
- Alcance autorizado: lógica de sesión, conectividad, persistencia y pruebas móviles. Quedan excluidos UI, widgets, estilos, temas, navegación y textos de interfaz.
- Cierre requerido: fuente real existente o `connectivity_plus` solo si es imprescindible; suscripción sin duplicados ni concurrencia; limpieza al logout, cambio de empresa y cierre; prueba offline → agotamiento → reconexión → 204 → borrado.
- Corrección aplicada: `connectivity_plus` aporta la transición offline→online al scheduler. El evento reinicia el límite agotado y se coalesce con cualquier revocación activa; la suscripción y temporizadores se liberan al cerrar la composición. Se añadieron pruebas de flujo completo, eventos repetidos y respuesta no `204`.
- Desarrollo: `READY_FOR_HANDOFF`. Validación: `flutter analyze`, `flutter test test/auth_session_test.dart --reporter expanded` (8 correctas), `flutter test --reporter compact` (19 correctas) y `git diff --check` correctos.
- QA independiente: `BLOCKED`. Candidate-ID validado; inspección de flujo y negativos conforme. Sus dos ejecuciones requeridas no produjeron salida y agotaron 60 s, por lo que no hay evidencia independiente aprobatoria. Cierre: obtener una ejecución visible de la prueba dirigida y de la regresión móvil sobre este mismo Candidate-ID.
- Diagnóstico y corrección mínima: se cerraron los `StreamController` de conectividad de prueba y el scheduler no rearma temporizador tras `dispose()`. La prueba determinista cubre cierre durante una revocación en curso. El runner sigue bloqueado antes de iniciar pruebas: `flutter --version` agotó 130.3 s sin salida en QA independiente.
- Estado vigente: `BLOCKED` por SDK/runner Flutter. Cierre: restaurar disponibilidad del ejecutable y ejecutar con salida visible `flutter analyze`, la prueba dirigida y `flutter test --reporter compact` sobre `d33a60e+5d1e0ea8`.
- Diagnóstico de entorno: `flutter` resuelve a `C:\tools\flutter\bin\flutter.bat` (SDK 3.44.8/Dart 3.12.2), mientras PATH también contiene Flutter 3.24.3 y `dart` 3.5.3. `flutter --version` venció sin salida tras 45.2 s; `dart.exe` del SDK responde. Lockfiles recientes coinciden con dos árboles activos de VS Code/Flutter daemon; no son huérfanos y no se terminaron. Cierre externo: cerrar esos daemons/instancias, priorizar el SDK correcto en PATH y, si persiste, reparar el SDK/caché en `C:\tools\flutter` con autorización de mantenimiento.
- Entorno recuperado: tras finalizar exclusivamente los árboles Flutter/Dart de VS Code y los lockfiles vacíos confirmados, el wrapper responde de forma estable mediante `cmd /d /c` con PATH de sesión priorizado. No se necesitó red, reinstalación ni cambios del proyecto.
- QA independiente: `PASS`. `flutter analyze` 0 incidencias (6.7 s); prueba dirigida 9/9 (4.2 s); suite 20/20 (8.7 s); `git diff --check` correcto. Se validaron flujo offline→agotamiento→wifi→`204`→borrado, no-`204`, coalescencia y `dispose()` sin rearme. Procede Seguridad.
- Seguridad: `CHANGES_REQUIRED` por SEC-MOB-002-01. El timeout de logout no limitaba el drenaje del cuerpo HTTP y podía retener la operación coalescida. Remediación aplicada: timeout integral, cancelación/aborto del cuerpo y prueba determinista de stream sin EOF → timeout → segundo `204`. Candidate-ID: `d33a60e+532919c9`; Desarrollo `READY_FOR_HANDOFF`; validación: analyze correcto, prueba remota 1/1, suite 21/21 y diff-check correcto. Requiere QA focalizada antes de reabrir Seguridad.
- QA de remediación: `PASS`. Candidate-ID y diff validados; `flutter analyze` 0 incidencias (4.4 s), prueba de cuerpo sin EOF 1/1 y suite 21/21. El timeout libera la operación, conserva ticket y un `204` posterior lo borra; sin regresión de no-`204` ni coalescencia. Procede revalidación de Seguridad.
- Seguridad final: `PASS`. SEC-MOB-002-01 cerrado: timeout integral, cancelación/aborto y liberación de operación; timeout/no-`204` preservan ticket y `204` es el único borrado. Reutiliza prueba QA 1/1 y suite 21/21. Procede DoF.
- DoF: `PASS`. Candidate-ID validado, Desarrollo `READY_FOR_HANDOFF`, QA y Seguridad `PASS`, sin hallazgos bloqueantes y `git diff --check` correcto.

## Delta de Desarrollo previo

- Implementados coordinador de sesión en memoria, refresh con coalescencia, interceptor de un reintento, almacenamiento seguro de refresh/ticket y cierre local/offline con ticket pendiente.
- Añadido adaptador REST para refresh/logout y composición sin cambios visuales; no existe acción de logout preexistente para conectar.
- Validación: `flutter analyze`, `flutter test` y `git diff --check` correctos.
- Corrección QA: `PendingLogoutRetryScheduler` ejecuta hasta tres intentos coalescidos (inicio y reintentos diferidos); un evento de conectividad adelanta el siguiente. El arranque lo activa sin restaurar sesión. Prueba de reinicio con ticket pendiente, `204` y borrado del ticket añadida.
