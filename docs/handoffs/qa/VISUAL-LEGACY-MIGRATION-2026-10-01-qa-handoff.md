# VISUAL-LEGACY-MIGRATION-2026-10-01 · QA

- **Estado:** `PASS`
- **Candidate-ID:** `359cc48+b48e2be676f6` (coincide con paquete y handoff Development; `git status --porcelain` conserva además el estado previo protegido).

## Mapeo y evidencia

- Retiro sin consumidores → `src/styles/global.css` y `src/styles/theme.css` eliminan las 28 definiciones y los 48 usos legacy → `rg --hidden --glob '!node_modules/**' --glob '!dist/**' -- '--theme-[A-Za-z0-9_-]+' frontend/followupbussiness` no devuelve referencias reales.
- Semántica claro/oscuro → `--visual-accent-soft`, `--visual-surface-hover`, `--visual-border-soft` y `--visual-focus-outline` están definidos en ambos temas; `accent-soft` oscuro conserva `#102f36` para rol seleccionado → pruebas golden de tema, shell, login y usuarios aprobadas.
- Imports/selectores/default-golden y regresión → `src/main.tsx` mantiene `global.css`/`theme.css`; los selectores oscuros y variantes no se retiraron → `npx playwright test tests/visual/theme.visual.spec.ts tests/visual/company-dashboard-shell.visual.spec.ts tests/visual/login.visual.spec.ts tests/visual/company-users.visual.spec.ts` aprobado (57).
- Superficie completa → CSS solamente en el delta de migración, sin cambios atribuibles a rutas, roles, sesión, caché, datos, WebSocket ni contratos → `npx playwright test tests/visual/company-clients-map.visual.spec.ts tests/visual/company-routes.visual.spec.ts` aprobado (53); cubre desktop/móvil, claro/oscuro, mapas, permisos/lectura, loading, vacío, error, forbidden, stale, tabla, diálogo y selección de rol. Un caso de mapa sin configuración fue omitido condicionalmente por requerir `VISUAL_MAP_UNCONFIGURED=1`.

Se reutilizan `test`, `typecheck`, `lint` y `build` correctos de Development; `git diff --check` correcto. Hallazgos: ninguno. Riesgo residual: ninguno específico de esta sustitución de tokens.
