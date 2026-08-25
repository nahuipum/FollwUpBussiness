# FE-033 — Development frontend

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD+babe434 diff:f0c0b0c6d6f4`

## Entrega

Nueva feature `src/features/company-settings/`: lectura de `GET /company/settings`, `ETag` contractual conservado literalmente en `If-Match`, y reemplazo por el `ETag` de 200. Solo COMPANY_ADMIN puede guardar `timezone`, `currency` y `saleEditWindowMinutes`; los valores de geocerca, frecuencia y retención se muestran como política fija. Se añadieron rutas y navegación para empresa, supervisor y vendedor; el estado se limpia ante cambio de sesión/empresa.

## Estados y contratos

Cobiertos carga, error/red, 403, 422, 409 sin sobrescritura con recarga explícita, actualización obsoleta y última actualización. No hay GPS, mapas, WebSocket, geocercas cliente ni datos de ubicación. Se reutilizó FE-039 como patrón visual; no existe mockup FE-033.

## Verificación

- Focalizadas: 5 pruebas PASS (`api`, página, layout).
- `npm run typecheck`, `npm run lint`, `npm run build`: PASS.
- `npm test -- --pool=threads --maxWorkers=1`: 257 pruebas PASS.
- `git diff --check`: PASS (solo advertencias de fin de línea).

Remediación QA: al cambiar sesión/empresa se invalida el snapshot y ETag anterior, se conserva carga y se consulta la configuración del tenant vigente. La prueba de hook verifica la transición `"7"` → `"8"` sin reutilización. Focalizadas (5) y type-check PASS; `git diff --check` sin hallazgos. Riesgo residual: el warning de chunk de Vite es preexistente/no bloqueante.

Remediación Seguridad: el formulario se vincula al ETag del snapshot. Si cambia a B, no se renderiza ni permite submit hasta sincronizar sus valores; la prueba A→B descarta `USD` y solo envía `COP`/45. Focalizadas (4) y type-check PASS.

Remediación Seguridad 2: además se vincula a generación de sesión. La prueba con ETags iguales A/`"7"`→B/`"7"` y generación 1→2 descarta render/envío de `USD` y solo guarda `COP`/45. Focalizadas (5) y type-check PASS.
