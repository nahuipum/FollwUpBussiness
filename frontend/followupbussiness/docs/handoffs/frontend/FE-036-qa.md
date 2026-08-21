# FE-036 — QA independiente (revalidación)

**Estado:** `PASS`  
**Candidate-ID:** `e7beb3e+ab9c84d218f4` (HEAD `e7beb3e`; firma y árbol de trabajo coinciden con el delta FE-036, junto con cambios concurrentes ajenos).

## Trazabilidad y evidencia

- Ruta/roles → `useSessionRoute`, `auth.canAccessPath`, `App` y `App.test.tsx` → `/company/customer-assignments` ya es protegida: restaura sesión persistida para Admin; Supervisor y Seller quedan sin acceso. Sidebar: entrada principal inmediatamente después de Clientes, ausente fuera de Admin.
- Sesión/tenant → `useCustomerAssignments` y prueba del hook → `submit()` captura clave/generación de sesión y, tras esperar tanto `assignOne` como `assignBatch`, descarta una respuesta obsoleta antes de error, resultado o `reload()`. Logout/cambio de empresa no republica datos previos.
- Orden/regresión → `App.test.tsx` → expectativa actualizada y verificada: Clientes → Asignar cartera → Auditoría.
- Contrato sin regresión → `api.ts`/`api.test.ts` → individual mantiene `sellerIds`, fecha y motivo normalizados; lote conserva `Idempotency-Key`, pluralidad y resultados parciales.

**Comando:** `npx vitest run src/features/company-customer-assignments/api.test.ts src/features/company-customer-assignments/hooks/useCustomerAssignments.test.tsx src/app/App.test.tsx --environment jsdom` → 38 OK.

Sin hallazgos en la revalidación. Riesgo residual no bloqueante: falta prueba visual/manual de foco y de respuestas Backend reales 403/404/409/422/red, ya cubiertas por los estados implementados.
