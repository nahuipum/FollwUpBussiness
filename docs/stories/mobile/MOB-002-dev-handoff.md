# MOB-002 — Handoff Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `d33a60e+532919c9`

Implementado en `mobile/followupbusiness`: access solo en memoria, rotación coalescida, limpieza `401`/`409`, interceptor con un reintento y secretos segregados. `AuthSessionRemote` consume refresh/logout MOBILE; logout conserva solo ticket ante offline/timeout. La composición inicializa el coordinador sin alterar UI.

Flujo online: refresh válido rota refresh/ticket y logout `204` borra ticket. Flujo offline: logout limpia access/refresh, detiene tracking y conserva ticket; `PendingLogoutRetryScheduler` hace hasta tres intentos coalescidos (inicio/reintento diferido) y permite adelantar uno ante conectividad, sin restaurar sesión.

Evidencia: `flutter analyze` limpio; `flutter test test/auth_session_test.dart` 7/7; `git diff --check` limpio.

Control → prueba: rotación, errores, interceptor, logout offline/`204` y reinicio→`204`→borrado de ticket → `test/auth_session_test.dart`; segregación/fallo de storage → `test/auth_secure_store_test.dart`; contrato MOBILE/login → `test/auth_http_repository_test.dart`.

Corrección QA: se incorporó `connectivity_plus` mediante una única suscripción de infraestructura. Una transición offline→online llama al scheduler, reinicia el límite agotado y mantiene coalescencia; eventos repetidos no duplican solicitudes. El listener y temporizadores se liberan al cerrar la composición. Pruebas nuevas cubren offline→agotamiento→wifi→`204`→borrado, eventos repetidos y no borrar ante respuesta distinta de `204`.

Evidencia de corrección: `flutter analyze` sin incidencias; `flutter test test/auth_session_test.dart --reporter expanded` 8/8; `flutter test --reporter compact` 19/19; `git diff --check` correcto. No se modificó Backend, UI ni contratos. Riesgo residual: disponibilidad declarada por plataforma no garantiza acceso al Backend; el `POST` sigue determinando éxito y conserva el ticket ante fallo.

Desbloqueo QA: el diagnóstico confirmó un `StreamController` de conectividad de prueba abierto y que el scheduler podía rearmar un temporizador si `dispose()` ocurría durante una revocación. Se cierran los streams de los tests y `_disposed` impide inicio, reconexión o reprogramación posteriores al cierre; una prueba con `Completer` verifica terminación determinista. No cambia el flujo funcional ni UI.

Validación bloqueada por entorno: antes y después de la corrección, `flutter --version`, `flutter analyze` y las pruebas no emitieron salida y vencieron (`exit 124`); `git diff --check` correcto. Se requiere reparar/disponibilizar el SDK/runner Flutter y repetir analyze, prueba dirigida y suite antes de entregar a QA.

Remediación SEC-MOB-002-01: el timeout anterior cubría solo `request.close()`; un cuerpo HTTP sin EOF retenía `_running`. `AuthSessionRemote` limita conexión y cuerpo en una sola ventana, cancela la suscripción y aborta la solicitud al vencer, devolviendo fallo recuperable sin borrar ticket. Prueba de servidor local determinista verifica stream abierto → timeout → reintento `204` → ticket eliminado. Validación: `flutter analyze` correcto; `flutter test test/auth_session_remote_test.dart --reporter expanded` 1/1; `flutter test --reporter compact` 21/21; `git diff --check` correcto. Sin cambios de UI, contratos ni secretos.
