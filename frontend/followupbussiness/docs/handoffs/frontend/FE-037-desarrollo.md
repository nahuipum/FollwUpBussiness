# FE-037 — Desarrollo Frontend (remediación)

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD 286ad04 + FE-037 territorios UI/rutas + assignedSellerCount + confirmación de inactivación`.

## Entregado

- Al editar una zona `ACTIVE` y seleccionar `INACTIVE`, **Guardar cambios** abre una confirmación accesible antes del `PATCH`. Indica que se bloquean nuevas asignaciones, sin eliminar la zona ni alterar referencias históricas.
- **Cancelar** cierra la confirmación y no llama a la mutación. **Confirmar inactivación** conserva `If-Match` y emite la mutación una sola vez; una guarda en `useTerritoryForm` descarta reenvíos mientras está pendiente.
- Crear zonas y toda edición que no sea `ACTIVE → INACTIVE` conservan el envío directo. Se mantienen 409, cancelación/revocación por sesión o empresa y los demás estados existentes.
- Se reutilizó `ModalSurface`; no se duplicó infraestructura de diálogos. No existe mockup exacto `FE-037`; no se alteraron mockups.

## Archivos

- `src/features/company-territories/components/TerritoryFormDialog.tsx`
- `src/features/company-territories/hooks/useTerritoryForm.ts`
- `src/features/company-territories/components/TerritoryFormDialog.test.tsx`
- `src/features/company-territories/hooks/useTerritoryForm.test.tsx`

## Evidencia y reproducción

- `npm test -- src/features/company-territories/api.test.ts src/features/company-territories/components/TerritoryFormDialog.test.tsx src/features/company-territories/hooks/useTerritoryForm.test.tsx` — 3 archivos, 6 pruebas pasan.
- `npm run typecheck` y `git diff --check` — pasan.
- Como admin: editar zona activa, elegir **Inactiva**, guardar; cancelar no produce solicitud. Reabrir, confirmar y repetir el clic: solo inicia una mutación.

## Riesgos

Sin riesgos frontend pendientes; actualizar el Candidate-ID antes de QA.
