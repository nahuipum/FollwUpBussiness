# FE-034 — Handoff de Desarrollo

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `f027a0b + 337464cb`

Se asoció cada `apiRequest` con la generación de sesión activa. Al limpiar, expirar o reemplazar la sesión, `clearSession` incrementa y propaga la generación; el transporte aborta solicitudes pendientes cuando el navegador lo permite. Una respuesta cuyo alcance ya no coincide se rechaza como `ApiRequestObsoleteError` antes de normalizar, publicar error, limpiar sesión, alterar permisos/datos o renderizar `correlationId`.

El listener global valida además la generación al recibir el error. Por ello un `401` tardío de A no afecta B; un `401` vigente de B mantiene la limpieza y diálogo existentes. No hubo cambios de contrato, Backend, reglas de tenant/permiso ni mockup.

Archivos: `src/lib/api.ts`, `src/features/auth/auth.ts`, `src/shared/ui/error-ui/useGlobalApiError.ts`, `src/app/App.test.tsx`.

Pruebas: `npm test -- --run src/app/App.test.tsx src/lib/api.test.ts` (30/30), `npm run typecheck`, `npm run build` y `git diff --check`, correctos.

Criterios cubiertos: A inicia solicitud; B reemplaza identidad/tenant; `401` tardío con `corr-a` se descarta sin diálogo, alerta, redirección ni revocar roles/permisos de B. El `401` actual de B (`corr-b`) sí limpia B y activa el flujo de sesión vencida. Regresión: normalización y flujos existentes de errores se mantienen.

Riesgo residual: consumidores que llamen `apiRequest` deben tratar `ApiRequestObsoleteError` como resultado descartado; no contiene datos ni requiere UI. Reproducción: ejecutar la prueba de carrera anterior.
