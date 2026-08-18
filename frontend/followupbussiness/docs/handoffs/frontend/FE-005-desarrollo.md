# FE-005 — Desarrollo

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `f712293 + 3E5D437F6C9B` (digest de rutas, pruebas y `company-sellers`).

## Entrega

- Reemplacé `useSellerMock` por `api.ts` y `useSellers.ts`: `GET /sellers` tipado, parser defensivo de `SellerPage`, filtros `search`, `status`, `supervisorId` y `territoryId`, y paginación contractual.
- Remediación QA: `/supervisor/sellers` ahora compone el listado real. Conserva el guardia `SUPERVISOR`; la UI muestra exclusivamente navegación de supervisor y Backend mantiene el acotamiento de equipo.
- Remediación Seguridad: el detalle y estado derivado se invalidan por generación de sesión, identidad, empresa (por `company.id` cuando existe) y roles. El diálogo se cierra al recibir el cambio de sesión, antes de mostrar datos del nuevo tenant.
- La tabla, detalle y filtros consumen `supervisor.displayName` y `territories[].name`; los selectores muestran etiquetas humanas y envían solo IDs. No hay lookups por fila ni UUIDs visibles.
- Conservé estilos/composición de `company-sellers`; retiré altas, edición y cambio de estado, fuera de FE-005. La única acción es ver detalle.
- Se cubren carga, vacío, error/403, actualización con datos anteriores y última actualización. El hook invalida solicitud y limpia datos/filtros ante logout o cambio de identidad/empresa.

## Evidencia

- Prueba de ruta afectada: `npm test -- src/app/App.test.tsx` (27/27), incluida regresión A→B: nombre, correo y código del tenant A desaparecen antes de cargar B.
- `npm run typecheck` y `git diff --check` correctos. La primera entrega ya validó `api.test.ts` (2/2), lint y build; esta remediación no modifica transporte ni composición compartida.

## Criterios y riesgo

Acceso sigue protegido por rutas existentes (`COMPANY_ADMIN`/`SUPERVISOR`; Backend es autoridad). Sin mockup FE-005; se preservaron los tokens, jerarquía y responsive del feature existente. Riesgo residual: las opciones de supervisor/zona se limitan deliberadamente a relaciones presentes en la página recibida, como exige el alcance; no se introdujeron consultas lookup.

Reproducción: iniciar sesión autorizada, abrir `/company/sellers` o `/supervisor/sellers`, aplicar filtros y navegar páginas; forzar 403 o error de `/sellers` para verificar el estado correspondiente.
