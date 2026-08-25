# INT-006 — Remediación Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `01589d3 + dcdce259805f`.

## Cambio

- `src/features/company-client-import/hooks/useCustomerImportResult.ts`: ante `GET /customer-imports/{id}` `404`, elimina el trabajo y conserva `{ status: 404, correlationId }`. Así `CompanyClientImportResultPage` activa su estado accesible existente “No encontramos la importación”, con acción para volver a la carga. `403` conserva el flujo prohibido y `410` no cambia.
- `src/features/company-client-import/hooks/useCustomerImportResult.test.tsx`: regresión para `404` neutral; verifica resultado nulo, ausencia de prohibición y estado recuperable.

## Validación

- `npm test -- src/features/company-client-import/api.test.ts src/features/company-client-import/hooks/useCustomerImport.test.tsx src/features/company-client-import/hooks/useCustomerImportResult.test.tsx`: PASS (18).
- `npm run typecheck`, `npm test` (263) y `npm run build`: PASS.
- `git diff --check`: PASS.
- `npm run lint`: falla por cuatro errores existentes ajenos a esta remediación: `useCustomerImport.ts` (regla `set-state-in-effect`) y `company-settings` (tres). No hay hallazgos del cambio actual.

## Riesgo y reproducción

Acceder como `COMPANY_ADMIN` a `/company/customer-imports/<id-inexistente-o-de-otro-tenant>`: la API responde `404` neutral y se muestra “No encontramos la importación”; no se exponen contadores ni datos previos. Pendiente: QA revalida esta ruta y conserva la comprobación de `403`/`410`.
