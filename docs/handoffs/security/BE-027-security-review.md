# BE-027 — Revisión final de Seguridad

**Veredicto:** `PASS`  
**Candidate-ID:** `37da94f + 8b164f2` — `HEAD` es `37da94f`; paquete y QA registran el mismo digest y `git status --porcelain` conserva únicamente producción, prueba y artefactos BE-027. QA de revalidación: `PASS`.

## Superficie revisada

Remediación SEC-BE027-001 en `ListSuggestedCustomersService.validate`, traducción de `Invalid` en `RouteController.suggestedCustomers`, orden de autorización/puertos y prueba focalizada de abuso. Se reutiliza la evidencia del candidato para aislamiento tenant, rol/equipo, PII, observabilidad y ausencia de efectos laterales.

## Hallazgo revalidado

- **MEDIA — SEC-BE027-001: CERRADO (PASS).** El offset se calcula como `long`; `page=107374183&pageSize=20` excede `Integer.MAX_VALUE` y se rechaza antes de `authorize`. Reproducción: `mvn '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ListSuggestedCustomersServiceTest#rejectsOverflowingPageOffsetBeforeAnyPortIsConsulted' test` — PASS, 1/1. La prueba espera `Invalid` y verifica cero interacciones con Clientes, vendedores y scopes. El controlador captura `Invalid` y devuelve 400 mediante `problem`: mensaje neutral `Request cannot be processed`, `correlationId` en cabecera/cuerpo y sin datos parciales. No se alcanza carga, ordenamiento ni paginación de candidatos.

## Controles y riesgos

- **PASS:** validación previa, respuesta neutral, cero puertos, sin escrituras/auditoría/eventos; `git diff --check` PASS.
- **NOT_EXECUTED:** prueba HTTP dedicada; no existe en el candidato. El mapeo 400 se verificó por inspección directa del adaptador.
- **No aplican:** secretos, WebSocket, Redis/cache, mensajería, archivos, dependencias e infraestructura.
- **Riesgo residual:** las páginas válidas aún cargan y ordenan la cartera completa en memoria; validar límites de volumen operativos.
