# FE-005/006/007 — Handoff QA Frontend

**Estado:** PASS  
**Candidate-ID:** `03933fa + d86ef854` (firma actual verificada).

## Mapeo y evidencia

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Roles y acciones por estado | `CompanySellersPage`, `SellerTable` preservan lectura para `SUPERVISOR`; CTA y mutaciones solo para `COMPANY_ADMIN`; menú varía para INVITED/ACTIVE/INACTIVE. | `SellerTable.test.tsx`; escenarios visuales de tres menús. |
| Filtros/paginación y sesión | `useSellers` manda filtros contractuales, reinicia página y revoca lista/filtros/PII ante cambio de empresa o sesión. | `api.test.ts`; inspección de `useSellers`; listado visual 1440/1024/768/390. |
| Crear/editar/asignar/estado/invitación | API conserva payloads, `If-Match` donde aplica (edición e invitación), correlation ID validado, 409, motivo 5–500, busy y resultado asíncrono. | Tests API y de diálogos; escenario visual de conflicto. |
| Estados, A11y y compartidos | Loading/error/forbidden/empty, foco/Escape/retorno, portal del selector; variantes `golden` separadas de `default`. | 33/33 focalizados; MultiSelect cubre teclado, búsqueda, vacío, chips, flip, resize y default. |
| Fidelidad visual | React fresco contrastado con golden de lista, selector y confirmación; selector 390 px sin clipping, adyacente y sobre drawer. | 14/14 Playwright; `test-results/fe005-audit-after/current-*.png`, `selector-open-390.png`, `selector-selected-390.png`. |

## Comandos

- `npm test -- --run ...company-sellers... MultiSelect.test.tsx` — 33/33.
- `npm run test:visual -- tests/visual/company-sellers.visual.spec.ts` — 14/14.
- `git diff --check` — correcto.

## Regresión y riesgos

No se hallaron hallazgos reproducibles. No hay cambios de mapas ni WebSocket; no aplican a este diff. Riesgo residual: la fidelidad se valida con fixtures visuales deterministas; la autorización efectiva y el aislamiento tenant siguen siendo responsabilidad del servidor, aunque la UI revoca estado local al cambiar sesión/empresa.
