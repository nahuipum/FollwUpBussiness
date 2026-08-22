# INT-034 — Desarrollo Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `11c3909+8a9504501289`

## Cambios

- `company-customer-assignments` aplica el límite contractual de 1000 clientes: no permite seleccionar el 1001, anuncia el bloqueo mediante `role="alert"` y deshabilita la revisión hasta corregir la selección. `assignBatch` también rechaza el exceso sin emitir HTTP.
- El parser exige `Customer.status` y la pantalla presenta únicamente clientes `ACTIVE` recibidos del filtro contractual. Los responsables se siguen resolviendo desde la carga paginada de vendedores (una carga por páginas, sin llamadas por cliente ni UUID visibles). La respuesta masiva se limita a la forma contractual `{ results }`.
- La pantalla conserva la tabla durante una recarga, muestra la última actualización y anuncia de forma accesible que los datos podrían no estar vigentes. Los estados 403/404/409/422/red, filtros, resultados y limpieza por sesión/empresa permanecen activos.
- Se consultó `docs/frontendMockups/FE-036.html`: no existe; se mantuvo el diseño y componentes existentes.

## Evidencia

- `npx vitest run src/features/company-customer-assignments/api.test.ts src/features/company-customer-assignments/hooks/useCustomerAssignments.test.tsx src/app/App.test.tsx --environment jsdom` → 39 OK; incluye lote de 1001 sin solicitud HTTP.
- `npm run typecheck` → OK; `npm run build` → OK; `git diff --check` → OK.
- `npm run lint` → sin errores; una advertencia preexistente fuera del alcance en `company-territories/hooks/useTerritoryForm.test.tsx`.

## Delta de cierre

- Cambio de sesión/empresa: `useCustomerAssignments` limpia datos anteriores y recarga opciones del tenant nuevo; prueba focalizada `2 OK` y `npm run typecheck`/`npm run build` correctos.
- Backend: una segunda asignación futura para el mismo cliente devuelve `409` sin escritura, historial ni auditoría exitosa. `CustomerPortfolioAssignmentServiceTest` (`4/4`) y `CustomerPortfolioReadIntegrationTest` PostgreSQL (`11/11`) correctos.
- `mvn -q clean verify` → OK, incluida migración V37 con PostgreSQL/Testcontainers.

## Riesgos y reproducción

- Riesgo residual: validación visual/manual de foco y respuesta Backend real, cuando se consolide el candidato. Para reproducir: cargar más de 1000 clientes, seleccionar 1000 y tratar de seleccionar uno adicional; debe aparecer el aviso, no abrirse confirmación ni salir `POST`.
