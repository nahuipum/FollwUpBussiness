# Migración controlada de estilos legacy activos · paquete de contexto

- **Estado:** Development `READY_FOR_HANDOFF`; QA `PASS`; Security `NOT_APPLICABLE`; DoF `PASS`.
- **Antecedente:** auditoría `VISUAL-CLEANUP-2026-10-01` cerrada `PASS`, Candidate-ID `359cc48+b43fa14876fd`. Ese worktree y sus artefactos son estado previo protegido; no revertirlos.
- **Candidate-ID:** `359cc48+b48e2be676f6` (`HEAD` + digest reproducible del diff trackeado y archivos frontend no trackeados; excluye artefactos).
- **Ámbito:** solo `frontend/followupbussiness`; migración visual mínima. Prohibido cambiar negocio, endpoints, contratos, rutas funcionales, permisos, autenticación, caché o datos.

## Inventario previo con `rg`

- **Migrable ahora:** 48 usos `var(--theme-*)` activos, todos en `src/styles/theme.css`, más 28 definiciones legacy: 14 claras en `src/styles/global.css` y 14 oscuras en `theme.css`. No existen referencias `--theme-*` en features, componentes, tests o configuración.
- **Equivalencia exigida por semántica:** `background→visual-canvas`; `surface/raised/muted→visual-surface/-raised/-muted|subtle`; `text/strong/form/muted→visual-text/-strong/-soft|-muted`; `border→visual-border|control`; `accent/soft→visual-brand/-soft`; sombras completas→`visual-shadow-*`. `surface-hover` y `border-soft` solo usarán token visual existente si conserva función/contraste; si no, crear un único token `--visual-*` compartido, claro/oscuro, validado contra golden. No introducir hardcodes locales.
- **Dependencia estructural temporal:** importaciones de `global.css` y `theme.css` en `src/main.tsx`; capa oscura de selectores activos en `theme.css` para error UI, plataforma, tablas, users/sellers/territories/clients y variantes shared `default`; APIs `default/golden`. Se conservan los selectores mientras sus módulos base sigan necesitando compatibilidad, pero deben dejar de consumir `--theme-*`.
- **Caso ambiguo conservado:** `ClientFilters` mantiene API `legacy|golden`; producción usa `golden`, pero la variante por defecto todavía tiene prueba/compatibilidad. No retirarla en esta tarea sin demostrar todos los consumidores y equivalencia completa.
- Solo eliminar definiciones `--theme-*` después de `rg` pre/post cero en `src`, tests, imports, cargas dinámicas, Vite/TS e HTML. No eliminar archivos base, mapas, logos, workers ni variantes activas.

## Referencia visual y zonas protegidas

- Development aplicará `frontend-mockup-guidance` y consultará una sola vez: `docs/frontendMockups/_design-system.html`, `_application-shell.html`, `_golden-login.html`, `_golden-company-dashboard.html`, `_golden-clients.html`, `_golden-routes.html`, `_golden-mobile-supervisor.html`, `_golden-mobile-seller.html` y `FE-034-global-errors-permissions-ui-kit.html`. No modificar ni copiar mockups.
- Referencia productiva: componentes `golden` y CSS `--visual-*` ya migrado en auth, clientes, rutas, asignaciones y shared UI.
- Zonas protegidas: guards/menús por rol; sesión/logout; estados `401/403`, loading, empty, error, forbidden y stale; overlays/foco/Escape de diálogos; mapas, marcadores y avisos de ubicación; significado de estados; navegación responsive y bottom sheets. Solo cambiar color/superficie/borde/sombra mediante tokens equivalentes.

## Invariantes y gates

1. `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER` conservan exactamente rutas, acciones y datos actuales; Backend continúa autorizando.
2. Una sustitución visual no modifica DOM funcional, llamadas, navegación, estado, caché ni contenido mostrado; una denegación sigue sin revelar datos.
3. Foco, teclado, contraste, responsive y estados degradados permanecen visibles; datos/ubicación stale nunca parecen vigentes.

- Development: `docs/handoffs/frontend/VISUAL-LEGACY-MIGRATION-2026-10-01-development-handoff.md`; estado `READY_FOR_HANDOFF` o `BLOCKED`. Ejecutar búsquedas pre/post, pruebas focalizadas, `npm run test`, typecheck, lint, build, visual claro/oscuro desktop/móvil y `git diff --check`.
- QA: `docs/handoffs/qa/VISUAL-LEGACY-MIGRATION-2026-10-01-qa-handoff.md`; validar candidato, cero referencias eliminadas, pantallas/estados y regresión; `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.
- Security: `NOT_APPLICABLE`; el delta de esta migración es exclusivamente CSS/tokens y una aserción visual, sin cambios en auth, sesión, autorización, datos personales/ubicación o caché.
- DoF: `docs/handoffs/governance/VISUAL-LEGACY-MIGRATION-2026-10-01-dof-report.md`; una sola vez sobre candidato final, sin suites/fuentes, verificando gates y `git diff --check`.
