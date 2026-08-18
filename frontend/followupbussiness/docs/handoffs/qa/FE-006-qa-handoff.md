# FE-006 — Frontend QA handoff

Estado: `PASS`  
Candidate-ID: `HEAD 35836fd + FE-006 formulario/api/sesión/pruebas; delta: recarga accesible 409`.

## Revalidación focalizada

| Criterio | Implementación | Evidencia |
|---|---|---|
| 409 conserva inputs y ofrece recarga | `SellerFormDialog`, `useSellerForm.reloadAfterConflict` | Botón accesible “Recargar listado y conservar formulario”; limpia el conflicto, invoca `sellers.retry` y no resetea diálogo/campos. Prueba directa OK. |
| Fallo parcial sin éxito global | `useSellerForm.submit` | Al fallar PUT de supervisor conserva editor, identifica sección y refresca listado; prueba directa OK. |
| Logout/cambio de empresa | suscripción de `useSellerForm` | Invalida solicitudes, cierra diálogo y elimina opciones; prueba directa OK. |

## Validación

- `npm test -- --run src/features/company-sellers/api.test.ts src/features/company-sellers/components/SellerFormDialog.test.tsx src/features/company-sellers/hooks/useSellerForm.test.tsx` — 3 archivos, 10 pruebas OK.
- `npm run typecheck` — OK.
- `git diff --check` — OK.

Regresión directa: la recarga de conflicto reutiliza el refresco de FE-005; no altera permisos ni controles de gestión. Sin hallazgos abiertos. Riesgo residual: la prueba es aislada del Backend; su contrato no cambió en este delta. Sin mapas ni WebSocket afectados.
