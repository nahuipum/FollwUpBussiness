# FE-017 — QA Frontend

**Estado:** `PASS`
**Candidate-ID:** `359cc48+fe017-6cb5b17e4336`

## Mapeo y evidencia

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Publicar N→N+1 | `PublishRouteService` copia el snapshot en la transacción. | `PublishRouteServiceTest` verifica `supersedeAndCopy(..., 2)`; se reutiliza evidencia Development: 21 pruebas Backend OK. |
| PUBLISHED heredada N-1 | `ReorderRoutePointsService` consulta sólo N y, si falta, N-1 bajo tenant; revalida jornada, vigencia y permutación. | Caso heredado N-1 y denegación tenant/ámbito en `ReorderRoutePointsServiceTest`. |
| 409 seguro y UI | Controlador expone código seguro; `useRouteDraft` recarga sólo ante `ROUTE_VERSION_CONFLICT` o 409 sin código y distingue snapshots. | `RouteControllerTest` cubre `SNAPSHOT_MISSING`; pruebas de hook cubren conflicto y snapshot. |
| Regresión y UX | DRAFT/PUBLISHED, permisos, `If-Match`, sesión/tenant y orden conservan sus controles; el mapa mantiene alternativa textual. | Suite de rutas y regresión visual móvil de conflicto. |

## Validación

`npm test -- --run src/features/company-routes` — 15 archivos, 97 pruebas OK.

`npx playwright test tests/visual/company-routes.visual.spec.ts --grep "FE-017 conserva la revisión ante conflicto de publicación"` — OK; verifica `ROUTE_VERSION_CONFLICT`, revisión conservada, `Cargar estado actual` y ausencia de desborde horizontal en móvil.

`git diff --check` sobre el delta afectado — OK.

La repetición local de Maven quedó impedida por la ruta de repositorio `C:\\.m2`; se reutiliza la evidencia dirigida del handoff Development para los 21 tests Backend. No hubo WebSocket afectado ni hallazgos reproducibles. Riesgo residual: disponibilidad y permisos de UI son sólo UX; Backend mantiene autorización y aislamiento de tenant.
