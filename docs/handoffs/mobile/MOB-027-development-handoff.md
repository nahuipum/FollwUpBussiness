# Handoff Desarrollo Mobile — MOB-027

## Estado

`READY_FOR_HANDOFF`

Candidate-ID: `4555cda + e32507696317` (sin commit).

## Implementación

- `mobile/followupbusiness/lib/features/auth/infrastructure/auth_secure_store.dart`: mueve el puntero activo `(empresa, usuario)` a secure storage, usa ámbito canónico sin colisiones y migra/borra el metadato legado de preferencias.
- `mobile/followupbusiness/lib/features/auth/application/auth_session.dart`: reintenta la colección de tickets pendientes, sin leer ni usar la sesión activa posterior, y elimina cada ticket solo cuando el remoto confirma `204`.
- `mobile/followupbusiness/test/auth_secure_store_test.dart`, `test/auth_session_test.dart` y `test/auth_session_remote_test.dart`: cubren aislamiento de A/B, coexistencia por ámbito, `204`/no-`204` y adaptadores del puerto ampliado. El doble de almacenamiento elimina valores al borrar, igual que el almacenamiento seguro, y las aserciones comparan identidad/ticket deserializados.

No cambian UI, contratos REST/sync ni dependencias. OpenAPI `POST /auth/logout` autoriza MOBILE pendiente exclusivamente con `X-Session-Revocation-Ticket`: ticket opaco de un uso para su propia familia, sin access, refresh ni `allSessions`. El flujo offline guarda ese ticket junto con identidad de ámbito en secure storage, borra access/refresh, detiene tracking y limpia datos de A; login B conserva únicamente su propia sesión activa. Al reconectar, se revoca A con su ticket; `204` elimina solo A, cualquier otro resultado lo retiene.

## Matriz criterio → evidencia

| Criterio | Evidencia |
|---|---|
| Tokens protegidos | `auth_secure_store_test.dart` y access token solo en `ActiveSession` |
| Base por usuario/tenant | pruebas de segregación e identidad `(c.1, user.with.dot)` |
| Logout aplica política | `auth_session_test.dart`: offline, 204, reintento y limpieza de datos/tracking |
| Hallazgo Security | `auth_secure_store_test.dart`: A offline → B preserva A y borrar A no toca B; `auth_session_test.dart`: retry envía solo ticket A y no lo borra sin `204` |
| Logs seguros | no se incorporaron logs ni datos sensibles al diff |

## Comandos

- `flutter analyze` — excedió 240 s sin diagnóstico aun tras liberar procesos Dart; deja dos procesos Dart huérfanos, por lo que permanece bloqueado por entorno.
- `flutter test --no-pub -r compact test/auth_secure_store_test.dart test/auth_session_test.dart test/auth_session_remote_test.dart` — PASS, 19 pruebas (~2 s), tras liberar procesos Dart huérfanos. Incluye A offline → B, A/C, `204` selectivo y no-`204`.
- `git diff --check` — correcto.

## Riesgo y reproducción para QA

Con un almacenamiento seguro simulado: iniciar A, fallar logout remoto, iniciar B y restaurar red. El retry debe enviar exclusivamente el ticket A, conservar refresh/ticket B y borrar solo A tras `204`; con no-`204`, A sigue pendiente. Repetir con A/C pendientes para verificar que completar A conserva C. Para migración, dejar claves antiguas `auth.c1.u1.*` y metadatos de preferencias; al leer sesión debe recuperarse el mismo usuario/empresa, copiarse al ámbito seguro y eliminarse el legado. Si la escritura segura falla, el legado debe permanecer para evitar pérdida/revocación imposible.

Pendiente: QA independiente y revisión de seguridad. No se realizaron commits.
