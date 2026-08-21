# INT-033 — Handoff de Development

**Candidate-ID:** `c54d395 + 6969742688f9`  
**Estado:** `READY_FOR_HANDOFF`

## Cambios

- Frontend: clave estable por `company.id`, aborta solicitudes y limpia diálogos/opciones al cambiar de empresa; las mutaciones no se muestran ni ejecutan sin `canManage`; asignación comunica 403/409/422 y bloquea guardado sin territorios activos.
- Backend: prueba integrada HTTP para `GET /customers` y detalle como supervisor: equipo/cartera autorizados, cartera ajena y otro tenant sin exposición (`404`). La lógica de producción existente ya impone el alcance.
- Sin cambios de contrato, migraciones ni superficies futuras. Mockup consultado: `docs/frontendMockups/FE-004-users-roles-mockup.html`.

## Evidencia

- Backend: `mvn -q -Dtest=CustomerPortfolioReadIntegrationTest test` — 8 pruebas correctas.
- Frontend: `npm run typecheck`, 4 archivos/26 pruebas focalizadas, `npm run lint` y `npm run build` — correctos. Advertencias preexistentes: prueba de territorios y tamaño de chunk.
- `git diff --check` correcto.

## Pendiente para QA

Validar de forma independiente el alcance HTTP de clientes, asignación/reasignación, separación de estado de empresa, denegación visual y los estados de asignación. Rutas, tracking, visitas y reportes se difieren a sus integraciones de Sprint 4–9.
