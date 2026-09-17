# FE-037 — Handoff de Desarrollo

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `574be0e+dde667d7`

## Implementado

- Zonas conserva el workspace compartido y sus permisos, sesión/empresa, cancelación, `If-Match` y doble envío.
- La matriz visual aislada cubre los 32 estados declarados, con cinco registros y página 13/26; captura los estados principales y usa aserciones para transitorios.
- Se generan comparativos app/mockup reales como adjuntos de Playwright para ready, readonly, loading, refreshing, empty, error, menú, create, validación, duplicado, conflicto, confirmación y móvil.
- Las respuestas de `/territories` no activan el boundary global: la feature muestra sus estados, conserva borrador y correlation ID. Se actualizó su prueba contractual.
- Remediación QA: los comparativos usan el viewport efectivo de cada caso; hay evidencia app/mockup para 1440×900, 1024×768, 768×1024 y 390×844. Se cubre 422 de creación con drawer, borrador, copy y correlation ID.

## Archivos y contratos

`frontend/followupbussiness/tests/visual/company-territories.visual.spec.ts` y snapshots; `src/features/company-territories/api.ts` y `api.test.ts`. Se consultó, sin modificar, `docs/frontendMockups/FE-037.html`.

## Evidencia

- `npx playwright test tests/visual/company-territories.visual.spec.ts --update-snapshots --grep "ready-admin|desktop-1024|tablet-768|mobile-ready|create-validation-422"` y la misma selección sin update: 5 passed en ambas.
- `npx playwright test tests/visual/table-workspace-contract.visual.spec.ts`: 4 passed.
- `npm run test -- src/features/company-territories/api.test.ts`: 3 passed; `npm run typecheck` y `git diff --check`: correctos.

## Criterios, riesgos y reproducción

Los estados de carga, vacío, error, forbidden, stale/refresh, solo lectura, formularios, conflictos e interfaz móvil son alcanzables y comprobados. Riesgo residual: los comparativos son artefactos de inspección side-by-side, no una métrica automática de diferencia contra el mockup. Reproducir con el comando visual indicado; los PNG comparativos quedan en el `outputPath`/adjuntos de cada caso. No se modificó `FE-037.html` ni hubo commit.
