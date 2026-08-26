# BE-027 — Handoff QA (revalidación SEC-BE027-001)

**Estado:** `PASS`  
**Candidate-ID:** `37da94f + 8b164f2` (coincide entre paquete y handoff Development; `git status --porcelain` sólo contiene el alcance BE-027 y sus artefactos).

## Mapeo y evidencia

- **SEC-BE027-001: overflow de `page`/`pageSize` → 400 antes de lecturas de cartera.** `ListSuggestedCustomersService.validate` calcula el offset como `long`, rechaza `> Integer.MAX_VALUE` con `Invalid` antes de `authorize` y de los puertos Customers/Workforce. `RouteController.suggestedCustomers` traduce `Invalid` a `400` neutral con `correlationId`. `rejectsOverflowingPageOffsetBeforeAnyPortIsConsulted` usa `page=107374183`, `pageSize=20`, espera `Invalid` y verifica cero interacciones con `customers`, `sellers` y `scopes`.
- **Regresión funcional directa.** La validación preserva `page >= 0` y `pageSize` 1..200; sólo cambia el cálculo seguro del offset. El flujo posterior de tenant, vendedor/equipo, territorios, orden y paginación no fue modificado por la remediación.

## Comandos/evidencia

- `mvn '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ListSuggestedCustomersServiceTest' test` — PASS, 4/4.
- `git diff --check` — PASS.
- Se reutiliza `clean verify` PASS de Development para el mismo Candidate-ID.

## Hallazgos y riesgos

Sin hallazgos reproducibles ni regresión directa. Riesgo residual: no existe prueba REST dedicada que aserte la respuesta 400; el mapeo está verificado por inspección y el caso de uso por prueba focalizada. No aplican idempotencia, migraciones, escrituras, auditoría ni eventos a este GET.
