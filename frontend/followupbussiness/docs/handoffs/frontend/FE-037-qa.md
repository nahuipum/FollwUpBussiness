# FE-037 — QA Frontend (revalidación)

**Estado:** PASS
**Candidate-ID:** `HEAD 286ad04 + FE-037 territorios UI/rutas + assignedSellerCount + confirmación de inactivación`.

## Mapeo y evidencia

- `ACTIVE → INACTIVE`: `TerritoryFormDialog` intercepta el envío y muestra un `ModalSurface` con nombre accesible, foco inicial en **Cancelar** y texto que declara bloqueo de nuevas asignaciones, sin eliminación ni alteración de referencias históricas. `TerritoryFormDialog.test.tsx` verifica diálogo, mensaje y cancelación sin mutación.
- Confirmación: **Confirmar inactivación** delega al mismo `useTerritoryForm.submit`; `submittingRef` bloquea reenvíos mientras la solicitud está pendiente. `useTerritoryForm.test.tsx` reproduce dos clics y verifica una sola mutación. La llamada de edición preserva `If-Match` desde `api.ts`; el tratamiento de `409` continúa conservando formulario y ofreciendo recarga explícita en `useTerritoryForm.ts`/diálogo.

## Validación

- `npm test -- src/features/company-territories/components/TerritoryFormDialog.test.tsx src/features/company-territories/hooks/useTerritoryForm.test.tsx` — 2 archivos, 3 pruebas pasan.
- Se reutiliza `npm run typecheck` exitoso del handoff Development para el mismo Candidate-ID; `git diff --check` sin errores.

## Regresión y riesgos

La creación y las ediciones sin transición conservan envío directo; la cancelación no cambia datos. No hay mapas ni WebSocket afectados. La autorización, sesión/tenant y estados generales no cambiaron en esta remediación; se mantienen bajo la evidencia QA previa. Sin hallazgos ni riesgos nuevos.
