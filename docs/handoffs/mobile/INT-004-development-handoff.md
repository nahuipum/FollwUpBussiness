# INT-004 — Desarrollo móvil

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `d2f2a26 + INT-004:c584aaebb2c3` (candidato integrado; el delta posterior es solo de pruebas backend).

## Cambio y contrato

`POST /auth/login` y el refresh que reutiliza su parser aceptan una sesión `MOBILE` solo si el único rol es `SELLER` y `user.status` y `user.company.status` son exactamente `ACTIVE`. Cualquier otro estado resulta en `AuthFailure.neutral`, sin persistencia de secretos ni navegación al marcador existente. No se modificó `SellerHomePage` (`INT-004-MOB-01` sigue fuera de alcance).

## Flujo

- En línea: respuesta válida activa → persiste secretos segregados por empresa/usuario y navega; usuario invitado/inactivo o empresa inactiva → error neutral, sin sesión ni navegación.
- Sin conexión: la respuesta no exitosa conserva el comportamiento existente (`unavailable`); no se crean ni restauran credenciales. La sesión offline y la revocación pendiente no cambian.

## Archivos y pruebas

- `mobile/followupbusiness/lib/features/auth/infrastructure/auth_http_repository.dart`
- `mobile/followupbusiness/test/auth_http_repository_test.dart`

Comandos correctos: `flutter analyze lib/features/auth/infrastructure/auth_http_repository.dart test/auth_http_repository_test.dart`; `flutter test test/auth_http_repository_test.dart test/auth_session_test.dart`; `git diff --check`.

## Criterios, riesgos y reproducción

Cubierto `INT-004-MOB-02`: se rechazan `INVITED` e `INACTIVE` de usuario y `INACTIVE` de empresa sin llamar a `replaceSession`; una respuesta activa conserva el flujo. Riesgo residual: el servidor debe seguir suministrando ambos estados en login/refresh; respuestas incompletas también son rechazadas. Reproducir: responder `200` con el payload MOBILE válido y cambiar uno de esos estados; ejecutar `flutter test test/auth_http_repository_test.dart`.
