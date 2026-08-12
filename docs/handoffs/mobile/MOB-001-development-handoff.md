# MOB-001 — Handoff de Desarrollo Mobile

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `e887055 + status:df7f5c59bbb1`

Se integró `AuthHttpRepository` para login, recuperación y reset, con headers `X-Auth-Client: MOBILE` y UUID estable. La respuesta se rechaza si no es `MOBILE`, está incompleta o sus roles no son exclusivamente `SELLER`; no persiste ni navega. El access token permanece en memoria; refresh/ticket usan secure storage segregado por usuario y empresa, con limpieza ante cambio/fallo. Solo existe navegación a `SELLER`. Recuperación conserva confirmación neutral y trata `429/503`; se evita doble envío.

Archivos: `mobile/followupbusiness/lib/features/auth/{application,infrastructure,presentation}`, `lib/app/follow_up_bussiness_app.dart`, `pubspec.*`.

Validación PASS: `flutter analyze`; `flutter test`; `git diff --check` (advertencias CRLF ajenas).

La decisión local aprobada usa el enlace web `http://localhost:5173/password-reset?token=...`. Flutter no recibe, transmite ni persiste el token; no se implementó deep link temporal. El navegador restablece la contraseña y el usuario vuelve a iniciar sesión desde la app. `flutter analyze` y `flutter test` (5) PASS; no hubo modificación visual.
