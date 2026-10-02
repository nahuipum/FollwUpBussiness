# Limpieza de compatibilidad visual · paquete de contexto

- **Estado:** `CLOSED`; Development `READY_FOR_HANDOFF`, QA `PASS`, Security `NOT_APPLICABLE` y DoF `PASS`.
- **Antecedentes protegidos:** `VISUAL-LEGACY-MIGRATION-2026-10-01` (`359cc48+b48e2be676f6`) y `VISUAL-ALERTS-MIGRATION-2026-10-01` (`359cc48+1ff6b2f987c4`) cerraron `PASS`. No revertir ese worktree.
- **Candidate-ID:** `359cc48+c98c7320e25b` (`HEAD + digest corto` del frontend; artefactos excluidos).
- **Ámbito:** solo React/TypeScript/CSS del frontend. No cambiar negocio, contratos, endpoints, permisos, tenant, autenticación, refresh/logout, recuperación funcional ni rutas.

## Inventario y decisiones (`rg`)

- **`InlineAlert` — migrar ahora:** 34 instancias productivas en 17 archivos; 11 declaran `visual="golden"` y 23 usan el default. La diferencia es solo presentación/icono. Objetivo: una única API sin `visual`, con estilos golden/tokens `--visual-*`, manteniendo `info|warning|error`, `status|alert`, acción, contenido, correlation ID y overrides feature-specific necesarios. Retirar clases/selectores `--default|--golden` solo con cero referencias.
- **`ConfirmationDialog` — migrar ahora:** todos los consumidores productivos ya solicitan `appearance="golden"`; el default solo está sostenido por su prueba. Objetivo: un único diálogo moderno sin `appearance`. Conservar explícitamente foco inicial/retorno, Escape y backdrop solo cuando no está `busy`, cancelación, error, acción asíncrona y prevención de doble acción. Eliminar ramas/CSS/tests de compatibilidad, no semántica.
- **`PasswordRecoveryDialog` — migrable condicionado:** único consumidor en `PasswordRecoveryRoute`; wrapper/backdrop propio y CSS `recovery-modal*`. `ModalSurface` cubre portal, foco, Escape, backdrop, ARIA y responsive. Migrar composición solo si pruebas demuestran identidad exacta de acciones, cierre, foco y token válido/inválido/expirado; nunca tocar request, token, copy funcional o navegación. Si la equivalencia falla, conservar con causa concreta.
- **Otras APIs visuales mixtas — auditar y converger si son solo presentación:** `OperationDialog`, `AsyncStateCard`, `DataTable`/paginación, `DateFilterField`, `MultiSelect`, `ReadOnlyNotice`, `TableActionMenu`, `TableLoadingIndicator`, `TimeField`, `VisualSelect` y `ClientFilters legacy|golden`. Producción mezcla el estándar golden con defaults principalmente en plataforma, mapa de clientes e importación. Retirar el parámetro solo cuando todos los consumidores y pruebas queden en el estándar; conservar diferencias funcionales reales (p. ej. skeleton/spinner, densidad, responsive) mediante propiedades semánticas, no forks visuales.
- **Compatibilidad estructural necesaria:** `ThemeToggle`, selectores `data-theme="dark"`, imports únicos de `global.css`/`theme.css`, mapas, logos y workers tienen consumidores activos. No eliminarlos. Solo retirar selectores `:not(...--golden)` o reglas default que queden sin clases tras las migraciones.
- **Fuera de alcance:** no existe aviso de token próximo a vencer; no crearlo. No crear toasts/providers ni rediseñar.

## Referencia visual y zonas protegidas

Development aplicará `frontend-mockup-guidance` y leerá una vez `_design-system.html`, `_application-shell.html`, `_golden-login.html`, `_golden-company-dashboard.html`, `_golden-clients.html`, `_golden-routes.html`, `_golden-mobile-supervisor.html`, `_golden-mobile-seller.html`, `FE-002-password-recovery-states-v3.html` y `FE-034-global-errors-permissions-ui-kit.html`. No copiar/modificar mockups.

Proteger roles y datos, 401/403, sesión/caché, estados loading/empty/error/forbidden/stale/busy, responsive, contraste, foco, teclado, overlays y prevención de acciones dobles. `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER` conservan exactamente su alcance actual; Backend autoriza.

## Security preflight

1. Si se migra recuperación, el token nunca se registra/renderiza y request, validación, expiración, navegación y copy permanecen sin cambios.
2. Backdrop/Escape/cierre no deben enviar, repetir ni reactivar una operación; `busy` bloquea cancelación y doble confirmación donde ya lo hacía.
3. Correlation ID continúa validado; no mostrar payload, headers, stack, tenant ni datos personales adicionales.
4. Si recuperación/sesión/token/caché no reciben diff, Security será `NOT_APPLICABLE`; si reciben diff, revisión final obligatoria con un abuso focalizado.

## Gates y evidencia

- Development: `docs/handoffs/frontend/VISUAL-COMPAT-CLEANUP-2026-10-01-development-handoff.md`; búsquedas pre/post, pruebas de componentes/consumidores, typecheck, lint, build, Playwright desktop/móvil claro/oscuro y `git diff --check`.
- QA: `docs/handoffs/qa/VISUAL-COMPAT-CLEANUP-2026-10-01-qa-handoff.md`; confirmar API/clases eliminadas, variantes semánticas y regresión visual/funcional.
- Security: `NOT_APPLICABLE`; recuperación, sesión, token, caché y datos sensibles no recibieron diff. `PasswordRecoveryDialog` se conservó sin cambios.
- DoF: `docs/handoffs/governance/VISUAL-COMPAT-CLEANUP-2026-10-01-dof-report.md`; candidato final, estados, hallazgos y `git diff --check`, sin rerun de suites.
