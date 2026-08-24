# FE-012 — Handoff QA Frontend

- **Estado:** PASS
- **Candidate-ID:** `3c13280+dafdabcf8d32` (HEAD `3c13280`; estado/diff coinciden con la remediación declarada).

## Revalidación P1

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| `SUPERVISOR` no ve la opción | `clientGroup(..., canManage)`; llamada de supervisor con `false` | `CompanyWorkspaceLayout.test.tsx`: ausencia verificada |
| `COMPANY_ADMIN` sí la ve | llamada de empresa con `canManage` derivado del rol | misma prueba: presencia verificada |
| Regresión directa | rutas y feature sin cambio adicional | pruebas API/hook focalizadas pasan |

Validación independiente: `npm test -- --run src/app/components/CompanyWorkspaceLayout.test.tsx src/features/company-client-import/api.test.ts src/features/company-client-import/hooks/useCustomerImport.test.tsx` (7/7). `git diff --check` correcto.

No quedan hallazgos en el alcance revalidado. No aplican WebSocket ni mapa. Riesgo residual: el servidor sigue siendo la autoridad de autorización, fuera de esta corrección de visibilidad.
