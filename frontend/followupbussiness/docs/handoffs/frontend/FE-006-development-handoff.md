# FE-006 — Development handoff

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `HEAD 35836fd + FE-006 formulario/api/sesión/pruebas; delta: recarga accesible 409`.

## Entregado

- Formulario React/TypeScript de creación y edición para `COMPANY_ADMIN`; supervisor conserva solo lectura.
- Cliente tipado para POST/PATCH/PUT, `If-Match`, opciones activas paginadas y territorios únicos.
- Cierre y revocación de diálogo, solicitudes y opciones ante logout/cambio de empresa; errores, carga, vacío, 403, 409, 422, red y fallo parcial sin éxito falso.
- En 409, la acción accesible **“Recargar listado y conservar formulario”** refresca el listado sin borrar los inputs.

## Evidencia

- 10 pruebas focalizadas: `api.test.ts`, `SellerFormDialog.test.tsx` y `useSellerForm.test.tsx` — OK.
- `npm run typecheck` — OK.
- `npm run lint` — OK.
- `npm run build` — OK.
- `git diff --check` — OK.

## Criterios y riesgo

Se cubren permisos visuales, formulario accesible (labels, foco/trap/retorno), doble envío, opciones reales y conflicto/fallo parcial. El servidor mantiene la autoridad. QA puede forzar `PATCH /sellers/{id}` a 409 para comprobar que la recarga no pierde lo escrito.
