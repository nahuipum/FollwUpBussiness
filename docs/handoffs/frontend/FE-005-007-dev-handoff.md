# FE-005/006/007 — Development handoff

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `03933fa + d86ef854` (diff actual)

## Entregado

- `src/features/company-sellers/**`: listado responsive, tabla/paginación, menús, cinco drawers y estados async preservan permisos, sesión/empresa y contrato existentes. El detalle muestra seis campos, incluido correo y estado.
- Confirmaciones de estado/invitación y operación: encabezado, identidad, tonos/iconos, busy, conflicto y bottom-sheet móvil; inactivación explica no eliminación y aporta ayuda, placeholder, validación y contador del motivo.
- `src/shared/ui/{MultiSelect,DataTable,TableActionMenu,VisualSelect}`: golden aislado del default; selector de territorios con buscador, metadata, chips, footer, foco, flip/clamp y reposición por scroll/resize.
- Cobertura añadida para copy, búsqueda/vacío, chips, teclado/retorno de foco, flip/límites/resize y default. Golden de inactivación regenerado; evidencia del selector: `frontend/followupbussiness/test-results/fe005-audit-after/`.

## Evidencia

- Focalizados Sellers/MultiSelect/DataTable: 54/54. Consumidores directos VisualSelect/TableActionMenu/Users/Clients: 77/77.
- Visual FE-005 aislado: listado 4/4 (4211), menús/overlays 2/2 (4212), drawers/paginación 1/1 (4213), selector 1/1 (4214) y conflicto 1/1 (4215). Capturas explícitas `test-results/fe005-audit-after/current-*.png`; selector es viewport, no `fullPage`.
- `npm run typecheck`, `npm run build` y `git diff --check`: correctos. `npm run lint`: 0 errores; warning histórico en `useTerritoryForm.test.tsx`. Build conserva aviso histórico de chunks >500 kB.
- Suite: 370/372; los dos fallos preexistentes de `DateFilterField.test.tsx` siguen siendo selectores `[data-date=...]` inexistentes, sin relación con este candidato.

## Matriz / residual

Se contrastó la composición React con los estados y literales de `docs/frontendMockups/FE-005.html` (líneas 380–394, abierto por contradicción visual): columnas completas, filtros, bloques verticales de confirmación e identidad. No se modificó el mockup, API ni lógica/guards. Riesgo residual: los dos tests DateFilter ajenos requieren corrección en su propia historia.
