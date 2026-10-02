# VISUAL-LEGACY-MIGRATION-2026-10-01 · Development

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `359cc48+b48e2be676f6`
- **Ámbito realizado:** solo estilos compartidos; no se modificaron TS/TSX, rutas, permisos, sesión, datos, caché, mapas, logos, workers ni la API `ClientFilters legacy|golden`.

## Migración

- `src/styles/global.css`: se retiraron las 14 definiciones `--theme-*`; base y foco usan tokens `--visual-*`.
- `src/styles/theme.css`: se sustituyeron los 48 consumos legacy por equivalentes semánticos (`canvas`, `surface`, `text`, `control`, `brand` y `shadow-*`) y se retiraron las 14 definiciones oscuras.
- Tokens compartidos creados/ajustados, claro y oscuro: `--visual-surface-hover`, `--visual-border-soft`, `--visual-focus-outline` y `--visual-accent-soft`. Este último preserva el fondo seleccionado legacy (`#102f36` oscuro) sin alterar `--visual-brand-soft` de superficies golden.
- Búsqueda pre/post: cero referencias reales a `--theme-*` en `src`, `tests` e `index.html`.

## Referencias y preservación

Consultadas una vez: `docs/frontendMockups/_design-system.html`, `_application-shell.html`, `_golden-login.html`, `_golden-company-dashboard.html`, `_golden-clients.html`, `_golden-routes.html`, `_golden-mobile-supervisor.html`, `_golden-mobile-seller.html` y `FE-034-global-errors-permissions-ui-kit.html`.

Se preservan importaciones de `global.css`/`theme.css`, selectores estructurales oscuros, variantes `default/golden`, estados de error/forbidden/stale y comportamiento de overlays.

## Evidencia

- `npm run test` y `npm run typecheck`: correctos.
- `npm run lint`: correcto con 3 advertencias preexistentes de dependencias `useEffect` en mapas; sin errores.
- `npm run build`: correcto; conserva advertencia preexistente de chunks >500 kB.
- `npx playwright test tests/visual/theme.visual.spec.ts tests/visual/company-dashboard-shell.visual.spec.ts`: 11/11 correctos; claro desktop/móvil y oscuro desktop/móvil. Capturas oscuras revisadas en `test-results/visual/theme-*-dark.png`.
- Corrección focalizada: `npx playwright test tests/visual/company-users.visual.spec.ts --grep "invite dark reference"`: 1/1 correcto; comprueba radio seleccionado, fondo `rgb(16, 47, 54)` y texto `rgb(198, 207, 221)` en oscuro.
- `git diff --check`: correcto.

Riesgo residual: el cambio usa únicamente CSS/tokens; QA debe confirmar la matriz visual completa y que el Candidate-ID fijado coincida antes de avanzar.
