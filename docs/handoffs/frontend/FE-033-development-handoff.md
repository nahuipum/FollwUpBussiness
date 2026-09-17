# FE-033 — Desarrollo frontend visual

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD:574be0e+diff:d56c4e1c`

## Remediación

- Se cerró el hallazgo QA alto: `useCompanySettings.save` rechaza un nuevo PATCH si el último error es 403; la página bloquea formulario y guardar con ese estado hasta recargar.
- Pruebas observables: primer PATCH 403 seguido de intento de guardado mantiene exactamente una invocación; la página muestra campos y acción deshabilitados.
- `ReadOnlyNotice` golden tiene borde, radio y padding de referencia sin cambiar la variante default. Política de privacidad incorpora inset 18 px desktop / 14 px móvil; número conserva spinner; metadatos usan `HH:mm`; cabecera móvil ajustada.
- Ajustes finales aprobados: margen de 24 px entre aviso de solo lectura y tarjeta, eyebrow alineado, acción golden a la izquierda en móvil, triángulo de aviso y relojes ocultos en horarios deshabilitados.

## Superficie y contrato

- `CompanySettingsPage.tsx`, hook, estilos y pruebas de `company-settings`; `ReadOnlyNotice`, `TimeField` y alertas golden compartidas.
- Se mantienen GET/PATCH, ETag/If-Match, limpieza por sesión/empresa, null de plazo y el bloqueo previo para 409/stale.
- `COMPANY_ADMIN` edita, `SUPERVISOR` consulta y `SELLER` sigue denegado en React. La discrepancia con GET permitido por OpenAPI/backend permanece reportada y fuera de alcance.

## Evidencia

- `npm test -- --run src/features/company-settings/CompanySettingsPage.test.tsx src/features/company-settings/hooks/useCompanySettings.test.tsx src/features/company-settings/api.test.ts src/shared/ui/TimeField.test.tsx src/shared/ui/error-ui/components/ErrorUi.test.tsx` — 22 aprobadas.
- `npm run typecheck`, `npm run build`, `git diff --check` — aprobados.
- `npm run lint` — sin errores; warning ajeno existente en `company-territories/hooks/useTerritoryForm.test.tsx`.
- Comparación final: `test-results/fe033-actual/review2-readonly-390.png` (358×1804 frente a golden 362×1802; 4 px de shell) y `review2-conflict-1440.png` (1132×1120 frente a golden 1132×1127). Aviso, tarjetas, inset, controles, acción bajo texto y atenuación alineados; sin diferencia material.
- Montaje final aprobado: `test-results/fe033-evidence/movil-conflicto.png` y `movil-solo-lectura.png`; coinciden triángulo, acción, campos bloqueados y separación del aviso.

## Riesgo y reproducción

- Simular PATCH 403 tras editar: el primer rechazo deja visible el error, bloquea controles y evita un segundo PATCH hasta recargar.
