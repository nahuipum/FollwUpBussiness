# Alertas transversales · paquete de contexto

- **Estado:** `CLOSED`; Development `READY_FOR_HANDOFF`, QA `PASS`, Security `PASS` y DoF `PASS`.
- **Antecedente:** `VISUAL-LEGACY-MIGRATION-2026-10-01` cerró `PASS`, Candidate-ID `359cc48+b48e2be676f6`; ese worktree es estado previo protegido.
- **Candidate-ID:** `359cc48+1ff6b2f987c4` (`HEAD + digest corto` del frontend; artefactos excluidos).
- **Ámbito:** presentación React/TypeScript/CSS de alertas transversales. No cambiar refresh, logout, expiración, redirecciones, rutas, permisos, contratos, credenciales, caché ni contenido funcional.

## Inventario y clasificación (`rg`)

- **Ya alineados:** `ModalSurface` + `useDialogFocus`; `ConfirmationDialog appearance="golden"`; `PasswordRecoveryDialog` y estados FE-002; consumidores explícitos `InlineAlert visual="golden"`; correlation ID validado por `safeCorrelationId`; `useGlobalApiError` descarta generaciones antiguas y procesa un 401 una vez.
- **Migrables ahora:** `AuthErrorDialog` es el único consumidor de `ModalDialog`/`modal-dialog.css`; puede converger en `OperationDialog`/`ModalSurface` y retirar ese sistema solo tras `rg` cero. `SessionExpiredDialog` usa portal/backdrop propio sin la primitiva compartida; conservar su API/acciones pero reutilizar `ModalSurface` y estilos golden. `InlineAlert default|golden`, `ErrorState`, `FormAlert`, `OperationDialog` y `SessionStatusPage` conservan hardcodes/compatibilidad visual; migrar base a tokens `--visual-*`, consolidar variantes solo si todos los consumidores/tests quedan migrados. Retirar overrides globales o de `login.css` acoplados a IDs/clases únicamente tras cero referencias.
- **Compatibilidad necesaria:** `PasswordRecoveryDialog` implementa el golden FE-002 y semántica específica del token; no sustituir. `ConfirmationDialog default|golden` conserva diferencias de cierre/backdrop/busy y consumidores feature-specific; tokenizar lo afectado, no eliminar API sin equivalencia total. `FormAlert` admite contenido compuesto dentro de formularios; mantener API si convertirlo en `InlineAlert` generaría HTML inválido o pérdida funcional.
- **Ambiguo/decisión humana:** no existe alerta previa a expiración. El producto ya refresca en silencio y reintenta fallas temporales; no crear aviso, temporizador, renovación automática adicional ni toast. No existen toast/snackbar/provider/error boundary globales; no crear un sistema paralelo.

## Referencia visual y zonas protegidas

- Development aplicará `frontend-mockup-guidance` y consultará una vez: `docs/frontendMockups/_design-system.html`, `_application-shell.html`, `_golden-login.html`, `FE-001-login-states-v2.html`, `FE-034-global-errors-permissions-ui-kit.html` y `FE-002-password-recovery-states-v3.html`. No modificar/copiar mockups.
- Preservar: 401 limpia sesión y muestra un solo aviso; 403 no desloguea ni revela datos; `unavailable` no inventa expiración; navegación/refresh/logout actuales; foco, Escape y retorno de foco según acción permitida; mobile bottom sheet; roles/tenant; estados loading, success, warning, error, confirmation, forbidden y stale.

## Preflight Security · controles

1. Un 401 por generación limpia sesión una vez, redirige según el flujo vigente y no apila modales; cerrar solo descarta el aviso autorizado.
2. Un 403 conserva sesión, desmonta contenido restringido y no muestra payload, tenant, roles, correo, ubicación, headers, stack ni token.
3. Solo se muestra copy estático y correlation ID validado; cuerpos/códigos no aprobados permanecen omitidos.
4. Logout/cambio de tenant invalida solicitudes y alertas previas; una respuesta tardía no restaura datos ni modal.
5. La migración no altera `/auth/refresh`, `/auth/logout`, temporizadores, cookies/CSRF, redirect ni permisos.

## Gates y evidencia

- Development: `docs/handoffs/frontend/VISUAL-ALERTS-MIGRATION-2026-10-01-development-handoff.md`; `READY_FOR_HANDOFF` o `BLOCKED`. Búsquedas pre/post, pruebas alertas/auth/app, `npm run test`, typecheck, lint, build, Playwright login/errores/modales claro-oscuro desktop-móvil y `git diff --check`.
- QA: `docs/handoffs/qa/VISUAL-ALERTS-MIGRATION-2026-10-01-qa-handoff.md`; validar 401/403/red global, repetición, confirmación/success/warning/error, foco/teclado, temas y móvil; `PASS`, `CHANGES_REQUIRED` o `BLOCKED`.
- Security obligatorio: `docs/handoffs/security/VISUAL-ALERTS-MIGRATION-2026-10-01-security-report.md`; reutilizar QA y reproducir un abuso de sesión confirmando ausencia de token/datos de otro tenant.
- DoF: `docs/handoffs/governance/VISUAL-ALERTS-MIGRATION-2026-10-01-dof-report.md`; una vez sobre candidato final, sin suites/fuentes, verificando gates y `git diff --check`.
