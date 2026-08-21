# FE-010 — Handoff de Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD e7beb3e + 45 rutas modificadas (475+/113-) y 13 no seguidas; árbol concurrente preservado`.

## Implementación y criterio → evidencia

- Admin/Supervisor: rutas de mapa bajo sus respectivos submenús Clientes; Seller y Plataforma excluidos. Mapa/lista usan únicamente el resultado de `GET /customers`, preservan vacío Supervisor, fallback, sincronía de filtros y limpieza de contexto. Frontend: 36 pruebas focalizadas, `typecheck`, `lint` sin errores (advertencia ajena) y `build` correctos.
- Alcance servidor: `PortfolioAccessScopeService` deriva sesión/equipo; `CustomerPortfolioReadService` y `JdbcCustomerPortfolioStore` aplican tenant/cartera antes de filtros, conteo y paginación. Admin queda tenant-acotado; Supervisor sin cartera es vacío; `sellerId` externo se deniega. No cambió OpenAPI, producción, migraciones ni arquitectura.
- Pruebas Backend: `CustomerPortfolioReadIntegrationTest` cubre vacío, plataforma denegada y cambio de visibilidad por reasignación/equipo. Se repararon siete pruebas `workforce` desalineadas con la firma vigente de `SellerStore`, sin producción.

## Verificación

- `npm test -- --run …` — 36 correctas; `npm run typecheck`, `npm run lint`, `npm run build` — correctos.
- `mvn -q -Dmaven.repo.local=C:\Users\LUIS\.m2\repository -Dtest=CustomerPortfolioReadIntegrationTest test` y `mvn -q -Dmaven.repo.local=C:\Users\LUIS\.m2\repository clean verify` — correctos.
- `git diff --check` — correcto.

Riesgo residual: aviso informativo de bundle MapLibre; sin pendiente funcional.

Remediación QA: se eliminó la búsqueda local que desincronizaba lista/marcadores y se muestra `lastUpdated` con aviso de datos potencialmente no vigentes. Se añadieron 6 pruebas focalizadas; type-check, lint, build y `git diff --check` correctos.
