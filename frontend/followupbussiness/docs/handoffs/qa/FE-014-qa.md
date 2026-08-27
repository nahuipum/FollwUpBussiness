# FE-014 — QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `9e030b7 + FE-014 rutas-ui + tenant-detail-clear + lint-react-hooks` (working tree).

## Revalidación

- Cambio de tenant/logout: `useRouteDetail` compara el alcance de sesión (generación, usuario, empresa y roles); ante diferencia cancela la solicitud y limpia objetivo, detalle, error y carga. `useRouteDetail.test.tsx` reproduce cambio de tenant con el diálogo abierto y verifica el cierre; una renovación del mismo alcance lo conserva.
- Regresión directa del detalle: `RouteDetailDialog.test.tsx` mantiene la visualización limitada a secuencia y nombre autorizado, sin coordenadas ni ID de cliente.

## Evidencia

- `npm test -- src/features/company-routes/hooks/useRouteDetail.test.tsx src/features/company-routes/components/RouteDetailDialog.test.tsx` — 2 archivos, 2 pruebas aprobadas.
- `git diff --check` — aprobado.
- Delta `lint-react-hooks` inspeccionado: sólo `company-client-import/hooks/useCustomerImport.ts` y `company-settings/{CompanySettingsPage.tsx,hooks/useCompanySettings.ts}`; no altera la superficie de Rutas ni invalida la evidencia anterior.

No quedan hallazgos QA en el cambio revalidado. Sin WebSocket ni mapa en este alcance.
