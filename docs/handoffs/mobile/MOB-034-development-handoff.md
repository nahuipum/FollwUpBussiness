# Handoff Desarrollo Mobile — MOB-034

## Estado

`READY_FOR_HANDOFF`

Candidate-ID: `babe434 + 9efd9a7a` (HEAD + digest del diff móvil, sin commit).

## Implementación

- `mobile/followupbusiness/lib/features/app_shell/`: shell autenticado, destinos Inicio/Ruta/Actividad/Más, historial y página enfocada.
- `mobile/followupbusiness/lib/shared/ui/`, `lib/app/app_theme.dart` y `lib/features/auth/.../seller_home_page.dart`: componentes y tema MOB-033 reutilizados por la shell.
- `mobile/followupbusiness/test/app_shell_test.dart` y `test/design_system_test.dart`: navegación, Atrás en Inicio, plantilla enfocada, semántica y estado desactualizado.

Flujo online/offline: no hay llamadas REST/sync ni cambios de datos; las acciones son visuales y no producen logout, revocación, tracking, escritura local ni cola offline. Por ello no se altera idempotencia, datos originales, segregación local ni secure storage.

## Validación

- `git diff --check -- mobile/followupbusiness`: PASS.
- `flutter analyze`: iniciado; sin resultado antes del límite de 30 s por procesos Dart concurrentes compartidos.
- `flutter test test/app_shell_test.dart test/design_system_test.dart`: iniciado; sin resultado antes del límite de 30 s por la misma condición.

## Criterios y reproducción

Abrir Inicio, Ruta y Actividad; desde Actividad pulsar Atrás: vuelve a Ruta y luego Inicio. Pulsar Atrás otra vez debe conservar Inicio y mostrar el aviso de sesión activa. Cambiar destino rápidamente no debe superponer plantillas. Las acciones de jornada, ruta y avisos no deben generar logout ni efectos reales.

Riesgo: QA debe repetir analyze/tests con Flutter disponible y sin procesos Dart bloqueantes. No se realizaron commits.
