# Auditoría y limpieza visual transversal · paquete de contexto

- **Estado:** Development `READY_FOR_HANDOFF`; QA `PASS`; Security `PASS`; DoF `PASS`.
- **Candidate-ID:** `359cc48+b43fa14876fd` (`HEAD` + digest reproducible del diff trackeado y archivos frontend no trackeados; excluye artefactos de auditoría).
- **Ámbito:** solo `frontend/followupbussiness`; auditar y retirar código visual legacy sin referencias reales, migrar usos legacy comprobados y consolidar CSS duplicado con cambios mínimos. No cambiar reglas de negocio, contratos Backend, permisos, persistencia ni flujos.
- **Estado previo protegido:** el worktree ya contiene cambios de login, shell, rutas, mapas, tema, pruebas y artefactos MAP. Son cambios ajenos/preexistentes: preservarlos y adaptar la limpieza sin revertirlos. Base Git: `359cc48`.

## Autoridad visual y criterio de legado

- Referencias de Development: `docs/frontendMockups/_design-system.html` y `docs/frontendMockups/_application-shell.html`; consultar una vez mediante `frontend-mockup-guidance`. Los mockups específicos solo se abren ante una ambigüedad visual y no definen permisos ni comportamiento.
- Estándar actual identificado: tokens `--visual-*` de `src/styles/theme.css`; primitivas y componentes de `src/shared/ui`, `src/shared/layout` y `src/shared/theme`; CSS de componente importado una vez a nivel de módulo; variantes `golden` cuando ya forman parte de la API existente.
- Señales legacy a demostrar antes de cambiar/eliminar: tokens `--theme-*`, variantes `default`, selectores globales de compatibilidad, wrappers/componentes previos, CSS hardcodeado o duplicado y archivos sin consumidores. La mera ausencia de import estático no basta.
- Antes de cada eliminación, comprobar con `rg`: imports directos e indirectos, barrels, rutas, `import()`, Vite/TypeScript, tests/visual specs, assets/CSS `url()` y configuración. Repetir la búsqueda después. Si queda una carga dinámica o decisión de diseño no verificable: `BLOCKED`, sin eliminar.

## Superficie y estados

- Entradas/configuración: `src/main.tsx`, `src/app/App.tsx`, navegación/sesión, `vite.config.ts`, `tsconfig*.json`, `index.html` y `package.json`.
- Estilos compartidos: `src/styles`, `src/shared/ui`, `src/shared/layout`, `src/shared/theme`.
- Pantallas: login/recuperación, plataforma, company, supervisor y seller; clientes/mapa/importación, vendedores, usuarios, territorios, rutas, configuración, dashboard y estados globales.
- Rutas/roles protegidos: `COMPANY_ADMIN` conserva operación de su tenant; `SUPERVISOR` solo vendedores/datos asignados; `SELLER` solo información propia. Backend sigue siendo la autoridad.
- Estados a conservar: loading, empty, error, forbidden, stale, sesión expirada/no disponible, responsividad básica, foco/teclado y alternativa accesible cuando corresponda.

## Invariantes de seguridad

1. Actor/recurso: menús, rutas y acciones no amplían ni ocultan incorrectamente el alcance de rol/tenant.
2. Éxito: una migración visual conserva llamadas, navegación, datos y efectos existentes.
3. Denegación: `403`/forbidden no muestra datos o acciones restringidas ni restaura caché previa.
4. Falla/stale: no presenta datos o ubicación antigua como vigente; el aviso y bloqueo existentes se conservan.
5. Sesión: logout/cambio de empresa limpia estado/caché; no se exponen tokens, secretos ni datos personales en logs/evidencia.

## Evidencia y gates

- Development: inventario de archivos eliminados/migrados/conservados, evidencia resumida pre/post referencia, pruebas focalizadas, `npm run typecheck`, `npm run lint`, `npm run build` y revisión manual/visual de rutas afectadas. Handoff: `docs/handoffs/frontend/VISUAL-CLEANUP-2026-10-01-development-handoff.md`; estado esperado `READY_FOR_HANDOFF` o `BLOCKED`.
- QA: validar Candidate-ID, imports/rutas, estados visuales, permisos presentados, regresión y ausencia de huérfanos. Handoff: `docs/handoffs/qa/VISUAL-CLEANUP-2026-10-01-qa-handoff.md`; estado `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.
- Security: aplicable por cambios preexistentes/posibles en sesión, rutas/roles y ubicación. Reutilizar QA y reproducir solo un abuso decisivo. Reporte: `docs/handoffs/security/VISUAL-CLEANUP-2026-10-01-security-report.md`.
- DoF: una sola vez sobre candidato final, sin releer fuentes ni rerun de suites; comprobar gates, estado, Candidate-ID y `git diff --check`. Reporte: `docs/handoffs/governance/VISUAL-CLEANUP-2026-10-01-dof-report.md`.
