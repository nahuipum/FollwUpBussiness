# FE-007 — QA Frontend

**Estado:** PASS
**Candidate-ID:** `HEAD 286ad04 + FE007-7f177aa2`

## Mapeo y evidencia

- Acción/permiso: `SellerTable` solo incorpora Activar/Inactivar cuando `canManage` (derivado de `COMPANY_ADMIN`); `SellerTable.test.tsx` verifica que los perfiles de solo consulta no la ven.
- Confirmación y contrato: `SellerStatusDialog` muestra CTA y texto coherentes para activar/inactivar, exige motivo de 5–500, etiqueta el control, anuncia errores y conserva foco/teclado; `api.ts` usa `PATCH /sellers/{id}/status` con `status` y `reason`. Pruebas cubren motivo vacío/corto, cancelación, foco y petición exitosa.
- Estados: `useSellerStatus` bloquea doble envío, sustituye fila solo con `200` y conserva diálogo/motivo/fila para `403`, `404`, `409` y red; limpia selección, motivo y envío al cambiar sesión/empresa. Cubierto por `useSellerStatus.test.tsx`.
- Regresión: la tabla/listado FE-005 conserva estructura, columnas, menú y estilos; el diff añade únicamente la acción y estilos aislados del diálogo. No hay prueba visual automatizada específica disponible.

## Validación ejecutada

- `npm test -- --run src/features/company-sellers/api.test.ts src/features/company-sellers/hooks/useSellerStatus.test.tsx src/features/company-sellers/components/SellerTable.test.tsx src/features/company-sellers/components/SellerStatusDialog.test.tsx` — 4 archivos, 14 pruebas correctas.
- `npm run typecheck` y `git diff --check 286ad04` — correctos.

No se hallaron regresiones directas ni cambios fuera de FE-007. Riesgo residual: la autorización y el aislamiento tenant son decisiones finales del backend; la UI limita la exposición y revoca su estado al cambiar el ámbito.
