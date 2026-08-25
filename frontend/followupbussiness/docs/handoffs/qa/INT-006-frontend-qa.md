# INT-006 — QA Frontend

**Estado:** `PASS`  
**Candidate-ID:** `01589d3 + dcdce259805f`.

## Mapeo y evidencia

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| FE-012 plantilla, carga e idempotencia | `company-client-import/api.ts`, `useCustomerImport.ts`, página de carga | Validación previa focalizada: `api.test.ts`, `useCustomerImport.test.tsx`: PASS |
| FE-013 resultado, polling, Blob y 410 | `useCustomerImportResult.ts`, página de resultado | Revalidación: `useCustomerImportResult.test.tsx` (7 PASS); cubre parada terminal, 410, timeout, sesión, 403 y 404 |
| Roles/rutas y sesión/tenant | `auth.ts`, `App.tsx`, ambos hooks | Inspección: rutas UUID y menú restringidos a `COMPANY_ADMIN`; los hooks abortan/limpian al cambiar generación de sesión/empresa |

## Revalidación

**INT-006-FE-01 corregido:** el ramo `404` de `useCustomerImportResult.ts` descarta el trabajo previo y conserva el error neutral; `CompanyClientImportResultPage.tsx` muestra así “No encontramos la importación” y la acción de retorno. La prueba confirma `job=null`, `forbidden=false` y `{status: 404}`; no quedan contadores ni datos visibles. Los ramos 403 (sin datos, vista prohibida) y 410 (expira y bloquea nueva descarga) continúan pasando.

Comando ejecutado: `npm test -- src/features/company-client-import/hooks/useCustomerImportResult.test.tsx` (7 PASS). `git diff --check` sin errores. Riesgo residual: ninguno adicional en este cambio; mapas y WebSocket no aplican al alcance.
