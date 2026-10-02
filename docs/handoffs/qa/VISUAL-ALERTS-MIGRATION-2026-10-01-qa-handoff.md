# VISUAL-ALERTS-MIGRATION-2026-10-01 · QA frontend

- **Estado:** `PASS`
- **Candidate-ID:** `359cc48+1ff6b2f987c4`.
- **Firma:** confirmada con manifiesto compuesto: diff rastreado `f807fb7ef4b9…` más los cinco archivos frontend no rastreados ordenados; SHA-256 corto `1ff6b2f987c4`. La discrepancia previa fue falsa: se comparó el hash intermedio del diff, no la firma final.

## Mapeo y evidencia

- 401/sesión, 403/red, repetición y descarte de respuesta de tenant anterior → `useGlobalApiError`, `App`, `ErrorUi` → `App.test.tsx`/`ErrorUi.test.tsx` → 401 limpia una vez y conserva flujo; 403 no desloguea ni filtra; generación obsoleta no restaura aviso/datos.
- Éxito/advertencia/error/confirmación y compatibilidad `InlineAlert default|golden`, `ConfirmationDialog` y `PasswordRecoveryDialog` → componentes compartidos → pruebas focalizadas → preservadas; la última se justifica por semántica específica de token.
- Foco inicial, Escape autorizado, Tab/retorno de foco, modal/bottom sheet, tema y desktop/móvil → `ModalSurface`/`useDialogFocus`, `SessionExpiredDialog`, `AuthErrorDialog` → `ErrorUi.test.tsx` y Playwright login → correctos.
- Retiro legado → búsqueda `rg` → sin referencias a `ModalDialog`/`modal-dialog.css`; las coincidencias `recovery-modal-layer` pertenecen justificadamente a `PasswordRecoveryDialog`, no al sistema retirado.

No se observan cambios de permisos, contratos, sesión/refresh/logout, tenant, caché ni datos. No hay WebSocket o mapas dentro de la superficie funcional de alertas; la regresión compartida cubierta es `ConfirmationDialog`.

## Comandos

`npm run test -- src/shared/ui/error-ui/components/ErrorUi.test.tsx src/shared/ui/ConfirmationDialog.test.tsx src/app/App.test.tsx src/app/PasswordRecoveryScreen.test.tsx` — 4 archivos, 63 pruebas correctas.

`npm run test:visual -- login.visual.spec.ts --workers=1` — 12 pruebas correctas, incluidos oscuro y móvil.

`git diff --check -- frontend/followupbussiness` — correcto.

## Riesgo residual

Solo composición visual de contrastes en superficies no cubiertas por el spec focalizado; sin hallazgos bloqueantes.
