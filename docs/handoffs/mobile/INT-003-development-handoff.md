# INT-003 — Handoff de Desarrollo Mobile

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `78c1534 + INT-003-MOB:4adaa21cc689`

## Alcance y archivos

- `mobile/followupbusiness/lib/features/auth/infrastructure/auth_session_remote.dart`
- `mobile/followupbusiness/test/auth_session_remote_test.dart`

Se corrige exclusivamente `INT-003-MOB-QA-01`: el transporte móvil envía
`{"allSessions":false}` en `POST /auth/logout`, preservando los encabezados,
el ticket de revocación offline, el timeout y la limpieza existente.

## Flujo y evidencia

- En línea: `logout` recibe `204`; la prueba confirma que el cuerpo es el
  requerido y que un `refresh` posterior obtiene `401/REFRESH_TOKEN_INVALID`.
- Sin conexión: se conserva el flujo de ticket pendiente; la regresión directa
  confirma timeout y reintento posterior `204` con limpieza del ticket.

Control → prueba: cuerpo de revocación y rechazo de sesión revocada →
`logout revoca la sesión y el refresh posterior es rechazado`; reintento
offline → `timeout del cuerpo libera el scheduler...`.

Comandos correctos: `flutter test test/auth_session_remote_test.dart` (2
pruebas) y `flutter analyze` (sin incidencias). `git diff --check` correcto.

## Riesgos

No se ejerció un backend local real en esta remediación; el contrato HTTP se
validó con servidor local determinista. No se modificaron Backend, OpenAPI,
almacenamiento seguro, segregación local ni reglas de jornada.
