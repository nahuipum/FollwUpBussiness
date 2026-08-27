# FE-014 — Development handoff

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `9e030b7 + FE-014 rutas-ui + tenant-detail-clear + lint-react-hooks` (working tree, sin commit).

## Entregado

- Nuevo módulo `src/features/company-routes/`: listado de solo lectura, filtros `date`, `sellerId`, `status`, paginación y detalle accesible.
- Navegación y rutas `/company/routes` y `/supervisor/routes`; SELLER no recibe enlace ni autorización de ruta.
- El transporte consume únicamente `GET /routes` y `GET /routes/{routeId}`. Los nombres de vendedores se obtienen paginadamente, no por fila.
- El parser y el estado descartan coordenadas, IDs de cliente y datos adicionales; 403/404 elimina resultados, filtros y detalle. El estado se reinicia en logout/cambio de sesión o empresa.

## Delta tras QA

- `useRouteDetail` ahora observa el alcance de sesión y, ante logout o cambio de usuario/tenant, cancela la solicitud y limpia objetivo, detalle, error y carga. Una renovación sin cambio de alcance conserva el diálogo.

## Evidencia

- Pruebas nuevas: `api.test.ts`, `RouteTable.test.tsx`, `RouteDetailDialog.test.tsx` (filtros, codificación del ID, privacidad, paginación y detalle).
- Prueba focalizada añadida: `useRouteDetail.test.tsx` (detalle abierto durante renovación y cambio de tenant).
- `npm test`: 54 archivos, 269 pruebas aprobadas antes de la corrección; la revalidación focalizada posterior aprobó 4 archivos y 7 pruebas.
- `npm run typecheck` aprobado tras la corrección; `npm run lint` y `npm run build` aprobados en el candidato previo sin cambios de composición.
- `git diff --check` aprobado.

## Criterios y riesgos para QA

- Verificar navegación COMPANY_ADMIN/SUPERVISOR, ausencia para SELLER, filtros y páginas manipuladas contra las respuestas 403/404 del servidor.
- Reproducir sesión/tenant distinto: el listado, filtros y detalle previos no deben persistir.
- Confirmar que ni tabla ni diálogo presentan coordenadas, direcciones ni IDs de cliente. Mockup consultado: `docs/frontendMockups/FE-034-global-errors-permissions-ui-kit.html`; no hubo mockup FE-014.

## Validación CI-equivalente final

- `npm test`: 55 archivos, 270 pruebas aprobadas.
- `npm run typecheck` y `npm run build`: aprobados; el build conserva el aviso no bloqueante de tamaño de chunk.
- `git diff --check`: aprobado.
- `npm run lint`: bloqueado por cuatro errores fuera del alcance FE-014: `company-client-import/hooks/useCustomerImport.ts` y `company-settings/{CompanySettingsPage.tsx,hooks/useCompanySettings.ts}`. También informa un warning en `company-territories/hooks/useTerritoryForm.test.tsx`. No se modificaron esos módulos por instrucción de alcance.

## Delta de cierre de lint

- Corregidos los cuatro errores de `react-hooks` en `useCustomerImport` y `company-settings`, preservando el inicio de carga y la sincronización del formulario/ETag.
- `npm run lint` termina correctamente; queda un warning no bloqueante y ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.
- Revalidación: 3 archivos / 8 pruebas, `npm run typecheck` y `git diff --check` aprobados.
- Build trazable del Candidate-ID final: `npm run build` aprobado el 2026-08-26; conserva únicamente el aviso no bloqueante de tamaño de chunk. `git diff --check` volvió a aprobar.
