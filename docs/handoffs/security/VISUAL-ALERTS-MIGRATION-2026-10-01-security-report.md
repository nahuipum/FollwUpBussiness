# VISUAL-ALERTS-MIGRATION-2026-10-01 · Security

- **Estado:** `PASS`
- **Candidate-ID:** `359cc48+1ff6b2f987c4`.
- **Firma:** `HEAD 359cc48`; el diff rastreado conserva `f807fb7ef4b9…` y los cinco archivos frontend no rastreados coinciden con el manifiesto ordenado validado por QA. No se detectó deriva del candidato.

## Superficie revisada

Migración de `AuthErrorDialog` y `SessionExpiredDialog` a primitivas compartidas, renderizado global 401/403, normalización de errores, generación de sesión, cambio de tenant, redirección y cierre. `auth.ts`, `api.ts`, `navigation.ts`, `useSessionRoute.ts`, `useGlobalApiError.ts` y las pruebas de `App` no cambiaron; la modificación funcional de alertas queda limitada a composición visual, foco y cierre.

## Amenaza reproducida y evidencia

- **PASS — 401 tardío entre tenants:** `npm run test -- src/app/App.test.tsx -t "discards a delayed 401 from tenant A after tenant B replaces its session"` → 1 prueba correcta. La respuesta tardía del tenant A se rechaza como obsoleta, mantiene identidad/permisos del tenant B y no muestra modal ni correlation ID anterior. El 401 vigente posterior muestra un único diálogo y deja `hasSession()` en falso.
- **PASS — exposición:** `ApiError` solo transporta estado, correlation ID validado, campos acotados y códigos permitidos; el flujo 401 renderiza copy estático y correlation ID seguro. No existe vía de renderizado para JWT, `Authorization`, cookies, headers arbitrarios, stack, `detail`, payload interno ni datos del otro tenant.
- **PASS — 403:** la evidencia QA y la prueba parametrizada conservan la ruta autorizada y omiten `detail`; `useGlobalApiError` solo limpia sesión ante 401. Por tanto 403 no desloguea ni revela payload.
- **PASS — regresión protegida:** refresh/restauración, logout, redirecciones, permisos y generación de sesión no presentan diff. Cerrar el aviso 401 solo descarta la vista; no restaura credenciales ni sesión.

## Hallazgos, controles no aplicables y riesgo residual

Sin hallazgos de seguridad. No aplican cambios en secretos, dependencias, WebSocket, cache/Redis, mensajería, archivos o infraestructura. `NOT_EXECUTED`: no se repitieron suites completas ni validación visual; se reutilizó el `PASS` de QA. Riesgo residual bajo: defectos puramente visuales fuera del escenario focalizado, sin impacto observado en aislamiento, autenticación o exposición de datos.
