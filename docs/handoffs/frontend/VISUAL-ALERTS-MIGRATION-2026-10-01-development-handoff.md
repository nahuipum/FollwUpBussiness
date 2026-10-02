# VISUAL-ALERTS-MIGRATION-2026-10-01 · Development

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `359cc48+1ff6b2f987c4`
- **Ámbito:** solo composición y tokens visuales de alertas transversales; no se modificaron sesión, refresh, logout, temporizadores, redirecciones, roles, tenant, caché, contratos ni copy funcional.

## Inventario y migración

- `AuthErrorDialog` converge en `OperationDialog` golden; conserva su única acción `Cerrar` (sin nuevo cierre alternativo), foco inicial, Escape y retorno de foco mediante `ModalSurface`/`useDialogFocus`.
- `SessionExpiredDialog` ahora usa `ModalSurface` bottom-sheet con sus mismas acciones. Escape solo descarta el aviso cuando existe `dismissAction`; sin ella no introduce una nueva vía de sesión.
- `InlineAlert`, `ErrorState`, `FormAlert`, `ModalAsyncState`, `OperationDialog` y `SessionStatusPage` consumen tokens `--visual-*` para los tonos y superficies afectados.
- Se eliminan `ModalDialog.tsx`, `modal-dialog.css` y los overrides de `login.css` acoplados a ese sistema. Búsqueda posterior sin usos de `ModalDialog`, `modal-dialog`, `error-ui-dialog-backdrop`, `modal-layer` o selectores `.modal[...]`.
- Compatibilidad preservada: `PasswordRecoveryDialog` y `ConfirmationDialog` mantienen API y comportamiento. `InlineAlert` conserva API `default|golden`: el default sigue siendo consumido por alertas globales y formularios/importaciones, y golden por territorios/configuración; solo podrá retirarse o unificarse tras migrar esos consumidores y sus pruebas. Los selectores `:root[data-theme="dark"]`, `ThemeToggle` y sus clases de login/dashboard siguen teniendo consumidores en login, recuperación y layout; solo se retiran cuando no queden superficies conmutables ni pruebas de tema. No se creó toast/snackbar/provider ni aviso previo a expiración.

## Accesibilidad y controles

- Diálogo de sesión: `role="dialog"`, `aria-modal`, referencias de título/descripción, foco inicial en acción primaria, trampa de Tab, Escape autorizado y retorno de foco.
- Alertas mantienen `status`/`alert`; correlation ID sigue filtrado por el componente existente y no se expone payload, token, tenant, roles ni datos personales.
- Prueba añadida: foco inicial y Escape con acción de descarte en `ErrorUi.test.tsx`.

## Referencias y validación

- Mockups consultados: `docs/frontendMockups/_design-system.html`, `_application-shell.html`, `_golden-login.html`, `FE-001-login-states-v2.html`, `FE-034-global-errors-permissions-ui-kit.html`, `FE-002-password-recovery-states-v3.html`.
- Correctos: `npm run typecheck`; prueba focalizada de alertas/confirmación/login (18); `npm run test` (79 archivos, 497 pruebas); `npm run lint`; `npm run build`; `git diff --check`.
- Playwright secuencial correcto: `login.visual.spec.ts --workers=1` (12), `password-recovery.visual.spec.ts --workers=1` (19) y `company-sellers.visual.spec.ts --workers=1` (16), incluyendo claro/oscuro, login/sesión, recuperación y un consumidor de diálogos/alertas compartidos. El primer login detectó una coincidencia de dos controles “Cerrar”; se retiró el cierre adicional, se regeneraron los dos snapshots visuales afectados por la migración y la repetición final pasó 12/12.

## Riesgos y reproducción

- Riesgo residual visual: contraste/composición en viewport móvil y oscuro; validar con Playwright los estados login, 401/403/red, confirmación y alertas.
- Reproducción: provocar el error de login; comprobar modal golden, Tab/Escape/cierre y retorno de foco. Renderizar `SessionExpiredDialog` con y sin `dismissAction`; solo el primer caso cierra con Escape.
