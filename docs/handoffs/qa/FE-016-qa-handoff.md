# FE-016 — Handoff QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `b6d8d35 + ac4bee151f2b`

## Revalidación de remediación

La ayuda interna del editor ahora usa el identificador único `route-order-editor-help` y su lista referencia ese ID. La ayuda general del modal conserva `route-order-help`, sin colisión. `RouteOrderEditor.test.tsx` verifica una sola ayuda propia, la asociación `aria-describedby` correcta y la ausencia del ID anterior dentro del editor.

## Mapeo y evidencia

- Acceso y flujo: `COMPANY_ADMIN`/`SUPERVISOR` ven la acción sólo para `DRAFT`; el detalle cierra antes de abrir propuesta. `RouteDetailDialog.test.tsx` y `useRouteDraft.test.tsx` cubren orden de cierre, retorno desde orden y ausencia de modales superpuestos.
- Candidatos/tenant: `useRouteDraft` filtra cartera y sugerencias por territorios del vendedor, conserva sólo el ID en memoria y limpia el estado con cambio de sesión/empresa. Cobertura focalizada de candidatos dentro/fuera/sin territorio.
- Contrato/errores: el cliente envía `windows: []`, conserva `proposalVersion` al guardar e interpreta los 422 públicos, incluidos extremos y territorios, sin exponer detalle interno. `api.test.ts`, `lib/api.test.ts` y `RouteProposalDialog.test.tsx` lo verifican.
- Regresión directa: DnD sin respaldo por secuencia, flechas accesibles, estados de mapa (carga/error/alternativa), jornada/ventanas y `DateFilterField` con hora están cubiertos por los tests afectados. La asociación ARIA del modal de orden quedó revalidada.

## Contexto Backend previo preservado

- El candidato deriva origen/destino de primer/último `Route.Point`, no usa `route.startLocation` ni retorno al origen; ausencia de extremo responde `ROUTE_ENDPOINT_LOCATION_REQUIRED` antes de cuota, matriz o persistencia.
- El contrato exige `windows`, admite `[]` y rechaza `null`; los 422 de jornada/ventanas son seguros, trazables y sin detalle interno.
- La persistencia del orden enlaza `proposalVersion` con `If-Match`; la UI sólo aplica el resultado en memoria hasta guardar.
- Las validaciones Backend informadas por Development (`OptimizeRouteServiceTest`, `RouteOptimizationControllerTest`, `RouteEngineDecisionPolicyTest`, `HexagonalArchitectureTest` y `ModuleBoundaryTest`) permanecen como evidencia reutilizada, no reejecutada por esta QA frontend.

## Validaciones ejecutadas

- `npm test -- --run src/features/company-routes/api.test.ts src/features/company-routes/components/RouteProposalDialog.test.tsx src/features/company-routes/components/RouteDetailDialog.test.tsx src/features/company-routes/components/RouteDraftDialog.test.tsx src/features/company-routes/components/RouteOrderEditor.test.tsx src/features/company-routes/components/RouteSequenceMap.test.tsx src/features/company-routes/hooks/useRouteDraft.test.tsx src/lib/api.test.ts src/shared/ui/DateFilterField.test.tsx src/shared/ui/MultiSelect.test.tsx` — 64 PASS.
- `npm run typecheck` — PASS.
- `git diff --check b6d8d35` — PASS (advertencias de fin de línea ajenas, sin errores).
- Revalidación: `npm test -- --run src/features/company-routes/components/RouteOrderEditor.test.tsx` — 7 PASS.

Riesgo residual: no se identificaron riesgos adicionales en la remediación; las superficies Backend permanecen como evidencia reutilizada del candidato.
