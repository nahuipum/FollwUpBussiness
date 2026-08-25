# MOB-033 — Paquete de contexto

## Estado y candidato

- Desarrollo: `READY_FOR_HANDOFF`.
- Candidate-ID: `babe434 + 9efd9a7a` (HEAD + digest del diff móvil sin commit).
- Alcance: sistema visual compartido, tema y shell autenticada; sin REST/sync, sesión, tracking, persistencia ni assets nuevos.

## Implementación y controles

- `AppColors`, espaciados y radios centralizan tokens; `shared/ui/` ofrece botones, campos, tarjetas, alertas, estados y contenedores reutilizables.
- La shell consume esos componentes y conserva accesibilidad semántica, estados vacío/error/desactualizado y navegación visual.
- `AuthBrandHeader` conserva exactamente `AuthBrandMark`; este widget se trasladó a `shared/ui/brand_mark.dart` y sigue cargando `assets/brand/password_recovery_brand_mark.svg`. El login no cambia su composición ni añade assets.
- No se modifican token/secure storage, cola, idempotencia, datos originales, segregación local ni seguimiento de jornada.

## Evidencia y límite

- `git diff --check -- mobile/followupbusiness`: PASS.
- `flutter analyze` y `flutter test test/design_system_test.dart test/app_shell_test.dart`: iniciados, sin resultado antes de 30 s por procesos Dart concurrentes del árbol compartido; no se terminaron procesos ajenos.

## Siguiente fase

QA debe confirmar Candidate-ID y repetir las dos validaciones sin procesos Flutter/Dart contendiendo; comprobar semántica, navegación y que offline no origina escritura, red, sync, tracking o cambio de sesión.
