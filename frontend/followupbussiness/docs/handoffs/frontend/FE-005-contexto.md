# FE-005 — Paquete único de contexto

Estado de entrada Development: `READY_FOR_HANDOFF`. Candidate-ID: se calculará una única vez al terminar Development.

## Predecesoras verificadas

`BE-059` está `PASS` en Development, QA, Seguridad y DoF. `FE-003` está `PASS` y `FE-034` está `PASS` en sus artefactos frontend; sesión, limpieza por cambio de identidad y tratamiento global de `403` están disponibles. No bloquean la historia.

## Contrato resuelto

El fragmento OpenAPI `GET /sellers` declara roles `COMPANY_ADMIN` y `SUPERVISOR`, filtros `search`, `status`, `supervisorId`, `territoryId`, y respuesta `SellerPage`. El ajuste Backend/OpenAPI aprobado conserva `supervisorId` y `territoryIds`, y agrega `supervisor: { id, displayName } | null` y `territories: [{ id, code, name }]` en cada `Seller` de listado. Backend resuelve las referencias en lote y aplica tenant/equipo antes de enriquecer; no hay N+1 de navegador.

La composición visual existente muestra columnas y detalle de supervisor/zona con nombres. FE-005 debe consumir los campos enriquecidos para etiquetas humanas; no mostrará UUIDs, no inventará nombres ni hará lookups nuevos por fila.

## Alcance Development

Integrar dentro de `src/features/company-sellers/` cliente tipado, estado/hook, filtros y paginación reales. Mantener composición y estilos, sin editar mockup (no existe `docs/frontendMockups/FE-005*.html`). Los controles de filtros deben ofrecer etiquetas reales recibidas en la página actual sin mostrar UUIDs; sus valores internos pueden ser IDs contractuales. `COMPANY_ADMIN` y `SUPERVISOR` acceden por sus rutas existentes; `SELLER` permanece denegado por guardia y Backend. Limpiar datos al logout o cambio de empresa mediante el ciclo de sesión, manejar carga/vacío/error/403/stale y no habilitar acciones de FE-006/FE-007.

Validación contractual Backend: `mvn -q -Dtest=SellerTerritoryAssignmentControllerTest test` y `git diff --check`, correctos. No se iniciaron aún Development, QA, Seguridad ni DoF.
