# MOB-034 — Paquete de contexto

## Estado y candidato

- Desarrollo: `READY_FOR_HANDOFF`.
- Candidate-ID: `babe434 + 9efd9a7a` (HEAD + digest del diff móvil, sin commit).
- Alcance: shell autenticado y plantillas visuales; sin cambios REST/sync, sesión, tracking ni persistencia.

## Implementación y criterios

- Cuatro destinos raíz: Inicio, Ruta, Actividad y Más; los tres primeros solicitados están en la navegación inferior.
- Historial en memoria de destinos raíz. Atrás vuelve por Ruta/Actividad y, en Inicio, muestra un aviso sin cerrar la aplicación ni revocar sesión.
- La transición temporalmente deshabilita una segunda selección y usa opacidad antes de sustituir el contenido, evitando solapamiento de plantillas.
- Las acciones son muestras visuales: no realizan logout, no inician jornada, no activan tracking, no abren navegación externa ni exponen datos reales.
- Reutiliza los componentes de `shared/ui/` de MOB-033 y cubre accesibilidad, vacíos y dato desactualizado sin fecha ficticia.

## Evidencia y límites

- `git diff --check -- mobile/followupbusiness`: correcto.
- `flutter analyze` y pruebas focalizadas se iniciaron, pero no finalizaron antes del límite de 30 s debido a procesos Dart concurrentes del árbol compartido; no se terminaron ni modificaron procesos ajenos.
- Riesgo de QA: repetir analyze/tests en un entorno Flutter sin procesos bloqueantes y comprobar atrás físico en Inicio, historial Ruta→Actividad→Atrás y ausencia de efectos de sesión/tracking.

## Siguiente fase

QA debe validar el Candidate-ID y ejecutar `flutter analyze` y `flutter test test/app_shell_test.dart test/design_system_test.dart`, incluido el flujo online/offline sin efectos de red o sincronización.
