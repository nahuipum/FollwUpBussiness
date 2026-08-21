# FE-036 — Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `e7beb3e+ab9c84d218f4`

## Cambios

- Nueva feature `company-customer-assignments`: carga paginada de clientes, vendedores y territorios activos; filtros locales; selección individual o múltiple; asignación `PUT` y lote `POST` con `sellerIds`, vigencia, motivo e `Idempotency-Key`.
- Muestra responsables por etiqueta resuelta (marcador seguro si no existe), advertencia sobre rutas publicadas, confirmación modal accesible, resultado individual `ASSIGNED/REJECTED`, estados de carga/vacío/error/403/404/409/422/red y marca de actualización.
- Remediación QA: la ruta directa participa de restauración de sesión; `submit()` captura clave/generación y descarta respuestas de asignación que llegan tras logout/cambio de empresa, sin publicar resultado ni recargar el tenant anterior. La navegación prueba **Asignar cartera** inmediatamente tras Clientes.
- Patrones reutilizados: composición y tokens de Clientes/Vendedores, `DataTable`, `VisualSelect`, `ConfirmationDialog`, `AsyncStateCard`. No existía mockup FE-036 ni se modificaron mockups; se protegió sidebar/layout global.

## Evidencia

- `npx vitest run src/features/company-customer-assignments/api.test.ts src/features/company-customer-assignments/hooks/useCustomerAssignments.test.tsx src/app/App.test.tsx src/features/company-users/CompanyUsersPageRoute.test.tsx --environment jsdom`: 49 pruebas OK; cubre restauración Admin, denegación Supervisor/Seller, respuesta pendiente obsoleta y orden de sidebar.
- `npm run typecheck`: OK.
- `git diff --check`: sin errores (advertencias CRLF ajenas al alcance).

## Pendientes/riesgos

- QA debe revalidar el candidato; persiste como riesgo la validación visual/manual de foco y de respuestas reales 403/404/409/422.
