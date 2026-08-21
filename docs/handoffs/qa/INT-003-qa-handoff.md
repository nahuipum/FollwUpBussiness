# INT-003 — Handoff QA Mobile

**Estado:** `PASS`  
**Candidate-ID:** `78c1534 + INT-003-MOB:4adaa21cc689` (coincide con `git status --porcelain`; solo paquete, cambio móvil, prueba y handoffs de la candidatura).

## Mapeo y evidencia

| Criterio | Implementación | Evidencia independiente |
| --- | --- | --- |
| Login SELLER `ACTIVE`, cliente `MOBILE`, identidad/tenant/rol | Transporte y validación existente | API local con `.env`, sin exponer datos: `login 200`; canal MOBILE, usuario/empresa ACTIVE, IDs presentes y único rol SELLER. |
| Refresh válido y logout con revocación | `AuthSessionRemote.logout` envía `{"allSessions":false}` y acepta solo `204` | API: `refresh 200 → logout 204 → refresh del token rotado 401`. Cierra `INT-003-MOB-QA-01`. |
| Estado local seguro posterior | Access en memoria; refresh/ticket por ámbito en secure storage; limpieza coordinada | Regresión existente pasada: `auth_session_test.dart` confirma logout offline sin access/refresh, limpieza ante refresh inválido y reintentos; `auth_secure_store_test.dart` confirma segregación y eliminación del alcance previo. |
| Timeout/offline/retry | Cancelación/abort y scheduler sin cambio | `auth_session_remote_test.dart` verifica timeout, un reintento y borrado del ticket únicamente con `204`. |

## Entorno y comandos

- Windows/PowerShell, Flutter del repositorio y API local `127.0.0.1:8080`.
- `flutter test test/auth_session_remote_test.dart test/auth_secure_store_test.dart test/auth_session_test.dart test/auth_http_repository_test.dart` — exit 0.
- `flutter analyze` — exit 0.
- E2E HTTP directo con credenciales `.env`: estados anteriores, sin imprimir secretos/tokens. `git diff --check` correcto.

No se detectaron tokens ni secretos en diff/salida. Expirado, inválido/revocado, reinicio post-logout, cambio de tenant/usuario, vendedores no activos y GPS/tracking/permisos no cambiaron; se reutiliza su evidencia del candidato sin regresión.
