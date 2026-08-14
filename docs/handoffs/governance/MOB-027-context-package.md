# MOB-027 — Paquete de contexto

## Estado y candidato

- Estado de Desarrollo: `READY_FOR_HANDOFF`.
- Candidate-ID: `4555cda + e32507696317` (diff de código/pruebas Mobile, sin commit).
- Alcance: secretos de sesión locales, segregación por empresa/usuario y cierre de sesión. Sin UI, REST ni sincronización de negocio nuevos.

## Criterios y decisiones implementadas

| Criterio | Decisión | Evidencia |
|---|---|---|
| Tokens protegidos | Refresh, ticket y puntero de sesión se guardan únicamente mediante `flutter_secure_storage`; access token permanece efímero. | `auth_secure_store_test.dart` |
| Base por usuario/tenant | El ámbito codifica de forma canónica `companyId` y `userId`, evitando colisiones por separadores. | Pruebas de segregación e identidad con puntos |
| Logout aplica política | El coordinador existente detiene tracking, elimina datos locales del ámbito y borra refresh antes de conservar solo ticket para revocación offline. | `auth_session_test.dart` |
| Revocación pendiente aislada | Cada logout local guarda su ticket opaco con el ámbito original en secure storage; login/cambio posterior no lo elimina ni lo reasigna. El retry usa solo ese ticket y lo borra exclusivamente tras `204`. | `auth_secure_store_test.dart`, `auth_session_test.dart` |
| Logs seguros | No se añadieron logs ni se expone token, ticket, documento o coordenada. | Revisión del diff |

## Compatibilidad y límites

- La primera lectura migra el puntero legado de `SharedPreferences` al almacenamiento seguro y borra sus metadatos y claves antiguas solo tras escribir el ámbito seguro completo.
- No existe aún una base Drift/SQLCipher ni cola de negocio en esta aplicación; EN-015 define ese trabajo posterior. El adaptador de limpieza existente sigue siendo invocado por logout/revocación con `(userId, companyId)`.
- Riesgo a validar: migración con almacenamiento seguro inaccesible debe conservar los secretos legados; no se debe perder la posibilidad de revocar offline.

## Verificación de Desarrollo

- `flutter analyze`: excedió 240 s sin diagnóstico; deja procesos Dart huérfanos incluso tras liberar los previos.
- `flutter test --no-pub -r compact test/auth_secure_store_test.dart test/auth_session_test.dart test/auth_session_remote_test.dart`: PASS (19 pruebas, ~2 s) después de liberar procesos Dart huérfanos. El doble de secure storage ahora elimina valores al borrar y las aserciones comparan los campos deserializados.
- `git diff --check`: correcto.

## Siguiente fase

QA debe contrastar Candidate-ID, repetir analyze/suite y cubrir A offline → login B → reconexión: A persiste, se envía solo su ticket y solo `204` lo elimina; además dos tickets de ámbitos distintos, eventos coalescentes, migración legado y falla de secure storage. Seguridad aplica por secretos, datos personales y aislamiento local.
