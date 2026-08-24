# FE-013 — QA Frontend

**Estado:** `PASS`
**Candidate-ID:** `HEAD e327817 + diff rastreado f6761ba6a5cf6ac1192fe760ead8a9b52ec5fe59 + migración V39 y fuentes/pruebas FE-013 no rastreadas; excluye CSV ajenos clientes-importacion-{invalido,valido-1,valido-2}.csv`.

## Mapeo y evidencia

- Navegación desde FE-012 → `CompanyClientImportPage` conserva el `importId` y navega a la ruta dinámica; `App.tsx` compone el layout Clientes. Ruta/rol → `canAccessPath` exige UUID y `COMPANY_ADMIN`; acceso directo no autorizado no monta la vista.
- Resultado/polling → `useCustomerImportResult` serializa solicitudes, detiene el temporizador en estado terminal y muestra carga, obsoleto y reintento. Descarga → API devuelve solo `Blob`; 410 marca vencido y bloquea un nuevo intento.
- Negativos y aislamiento → 403/404 vacían contadores; cambio de sesión/empresa aborta y limpia estado. Pruebas cubren 403, 410, terminal y limpieza. No hay WebSocket, mapa ni modal nuevos; encabezado asociado, región `aria-live` y botones nativos cubren la superficie accesible afectada.

## Validación

- `npm run test -- src/features/company-client-import/api.test.ts src/features/company-client-import/hooks/useCustomerImport.test.tsx src/features/company-client-import/hooks/useCustomerImportResult.test.tsx` → 11 pruebas/3 archivos OK.
- `npm run typecheck` y `git diff --check` → OK.

Regresión directa trazada: el POST de FE-012 entrega el ID que desencadena la navegación; la ruta conserva el layout y la autorización local. Riesgo residual conocido: `duplicateRows` no existe en Backend y no se inventa en UI, conforme al paquete.

## Delta Backend

QA independiente revalidó `totalRows` y `completedAt` en POST/GET. `totalRows` es `null` solo mientras el conteo no es fiable; tras parseo válido incluye filas aceptadas y rechazadas. V39 conserva la restricción no negativa y JDBC mantiene `tenant_id`. Pruebas focalizadas Backend y `git diff --check` → OK. Riesgo residual bajo: no hay una prueba única que combine V39 con `JdbcCustomerImportStore.complete`.
