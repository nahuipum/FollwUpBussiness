# FE-004 — Handoff de Desarrollo

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `ceb2c20+8af0333a`

## Entrega

- Delta final revisado: `ConfirmationDialog` golden reutilizable incorpora regiones semánticas header/body/footer, `aria-describedby`, foco inicial en Cancelar y retorno, busy lock, error interno con título/mensaje/`CorrelationId`, y etiquetas específicas de bloqueo/reactivación. `ModalSurface` aporta bottom sheet móvil y scrim tokenizado; desktop conserva confirmación centrada. La reactivación informa el rol real.
- Contraste final: se definió `--visual-on-danger: #ffffff` para light/dark, ya consumido por el botón de peligro, y Playwright valida su color computado. Inspección actual/captura: 420 píxeles limitados al texto negro→blanco; block desktop/mobile/dark y reactivate pasan sin actualizar snapshots.
- Se fijaron el header 20/22/16, cierre 44 px bordeado, ring `--visual-focus-ring`, peligro estable en dark y panel `--visual-radius-lg` con `overflow: hidden`. La paginación golden es continua y estática: sin sombra, margen ni bordes externos, salvo el superior.

- Se sustituyeron los diálogos de invitación/edición/reenvío y detalle por `CompanyUserFormDrawer` y `CompanyUserDetailDrawer`; `DrawerSurface` porta a `body`, bloquea/restaura scroll, atrapa/retorna foco, respeta Escape cuando no hay mutación, tiene scrim, panel derecho de 500 px, body desplazable, footer persistente y ancho móvil completo.
- Remediación QA: `DrawerSurface` ahora recibe un slot `header` y renderiza header/body/footer como hermanos; el body es la única región con scroll. Formulario y detalle usan esos slots.
- La especificación visual incluye las 11 referencias explícitas: invite desktop/mobile/dark, edit, detalle loading/ready/error, bloqueo desktop/mobile/dark y reactivación. Las fixtures de detalle usan respuestas detenida, correcta y abortada de forma determinista.
- Bloquear/reactivar permanece como `alertdialog` centrado; conserva confirmación, busy/error, Escape condicionado y retorno al disparador. Se mantienen contratos, permisos, menú popover y `ModalSurface` para sus consumidores.
- Se eliminaron los dos componentes de diálogo reemplazados tras búsqueda de consumidores. Se consultaron `docs/frontendMockups/FE-004.html` y las 11 capturas aprobadas; no se modificaron mockups.

## Archivos

`src/features/company-users/**`, `src/shared/ui/DrawerSurface.tsx`, `src/shared/ui/drawer-surface.css`, `src/shared/hooks/useDialogFocus.ts`, `src/shared/ui/ModalSurface.tsx`, `tests/visual/company-users.visual.spec.ts`.

## Evidencia

- Focal: `npm run test -- CompanyUsersPageRoute.test.tsx` — 14/14; `npm run typecheck` y `npm run build` — OK.
- Revalidación r2: focal 14/14, typecheck OK, referencias visuales 11/11 y matriz FE-004 32/32. Build OK; visual shell 9/9. Lint focal sin errores (dos avisos preexistentes ajenos). `git diff --check` focal OK; el check global aún informa whitespace preexistente en `docs/handoffs/frontend/FE-004-qa.md`, no modificado por Desarrollo.
- `npm run lint -- …` — sin errores; dos avisos preexistentes fuera de FE-004. `git diff --check` — OK. Shell visual: `company-dashboard-shell.visual.spec.ts` — 9/9.
- Se regeneraron los baselines de overlays solo tras comparación manual contra las 11 capturas aprobadas; los baselines anteriores de overlays eran incompatibles con el drawer. La matriz visual FE-004 pasó 21/21; el estado forbidden verifica el `main` global productivo “No tienes acceso a esta sección”.

## Cierre visual y evidencia

- Tabla/paginación/metadata/page-size, badges, hover y loading usan variantes golden opt-in y exclusivamente `--visual-*`; el shimmer respeta reduced motion. Las primitives default permanecen cubiertas.
- `company-users` usa `publishErrors: false` en consultas y mutaciones: cada 401/403/404/409/422/500/503 se presenta localmente y un refetch 500 mantiene los datos previos con “Actualización pendiente”.
- Matriz Playwright determinista: 21 estados base, loading, stale 200→500 y 11 referencias de overlays. Se verificaron manualmente las capturas mobile, detalle y overlays contra `docs/frontendMockups/redesign/captures/fe-004-*`; baselines regenerados únicamente después.
- `npm run test -- src/features/company-users/api.test.ts src/features/company-users/CompanyUsersPageRoute.test.tsx src/shared/ui/DataTable.test.tsx src/shared/ui/TableLoadingIndicator.test.tsx src/shared/ui/VisualSelect.test.tsx` — 24/24. `npm run typecheck`, `npm run build` y shell visual 9/9 — OK. Lint focal sin errores (aviso de CSS sin configuración). La compilación conserva aviso preexistente de chunks >500 kB.
- `git diff --check` focal — OK. El global queda bloqueado solo por whitespace preexistente en `docs/handoffs/frontend/FE-004-contexto.md` y `FE-004-qa.md`, fuera de esta entrega.

## Remediación QA

- El 403 ya no reutiliza el table-shell: muestra “No tienes permisos”, el texto contractual, “Volver al resumen” y no deja filtros, tabla, CTA ni PII. El 401 conserva limpieza de PII; ambas rutas están cubiertas en la prueba funcional.
- Loading cambió a “Cargando usuarios” con cinco filas y cinco columnas skeleton, y las fechas visibles usan Hoy/Ayer/d MMM HH:mm.
- Regenerados e inspeccionados los baselines base actuales con fixtures Marina/Julián, Comercial Andina y Alex Medina: ready, tablet, dark, empty, no-results, readonly, menus, paginación, 360/390 y menú móvil; forbidden y loading se inspeccionaron contra el copy/anatomía vigente.

## Remediación visual final

- Toolbar 18/18/12, búsqueda sin herencia legacy, resultados solo con loading/datos/stale; empty/no-results no añaden marco interno y usan copy/CTA azul aprobados. Readonly recupera inset, borde y radio.
- Dark tiene overrides golden de búsqueda, identidad, acciones y badges. Filas golden usan caja de 54 px; fechas y metadata usan 24 h sin meridiano.
- Evidencia reciente: base visual 21/21, loading/stale/overlays 13/13 tras regeneración; shell 9/9; focal/primitives 25/25 y typecheck OK. Build/lint/diff focal se ejecutaron en el cierre; warnings preexistentes no bloqueantes.

## Riesgo y reproducción

Riesgo residual bajo: los snapshots dependen del navegador Win32; se fijaron fecha y fixtures `.example` para reducir variación. Reproducir con `npm run test:visual -- tests/visual/company-users.visual.spec.ts`; el caso stale afirma cinco filas y “Actualización pendiente” tras 200 inicial y refetch 500.

## Cierre Candidate `77a0632b`

- Paginación golden comprobada para primera, intermedia, última y única; añade elipsis y última página según la matriz, con pruebas explícitas. `VisualSelect` cubre default/golden y empty conserva CTA azul con `Plus`.
- Se retiraron de `theme.css` los selectores FE-004 sin consumidores y se aisló el estilo legacy del notice a `read-only-notice--default`; dark golden mantiene acciones transparentes y tokens visuales.
- Visual: base 22/22 y referencias/stale 12/12, sin `--update-snapshots`; total 34/34. Se reinició el listener Vite antiguo antes de promover los baselines afectados y se inspeccionaron ready, dark, empty, readonly y mobile frente a las capturas aprobadas.
- Validación: focal/primitives 30/30, typecheck, lint focal y build OK; shell 9/9 ya validado en la remediación precedente; `git diff --check` focal OK. Build solo informa el aviso conocido de chunks >500 kB.

## Delta final Candidate `e750427b`

- La metadata golden es vertical, el selector de tamaño ocupa 154 px y la paginación conserva elipsis en desktop y controles completos/apilados en móvil. El formatter horario está cubierto sin `a. m.`/`p. m.`.
- Stale usa el índice de `result.page` preservado; su caso Playwright es determinista a 1440×900 y conserva cinco filas/rango tras refetch 500. El detalle error responde `application/problem+json` 500.
- Se verificó la ausencia del selector residual `.company-users__search` en `theme.css`; `VisualSelect` conserva `useLayoutEffect` dependiente de `open` y `options.length`, que son los únicos valores de geometría usados.
- Evidencia: focal 29/29 y visual dirigido 5/5 sin actualización (paginación, 360/390, stale y detalle-error). Snapshots afectados tienen marcas 15:38 y fixtures deterministas.

## Remediación Security Candidate `e450aff1`

- `apiRequest` soporta `publishErrors: boolean | (status) => boolean`; las operaciones company-users publican solo 401. De este modo el manejador global invalida sesión, token/CSRF y PII, sin sustituir los errores locales 403/404/409/422/500/503.
- `mutationError` ya no contamina el estado del listado. `CorrelationId` usa el validador UUID existente y se entrega a estado de lista/stale, drawer de formulario, detalle y confirmación; el caso hostil no se muestra.
- Evidencia: `api.test`, `company-users/api.test` y ruta FE-004 cubren predicado 401, `correlationId` válido/hostil y mutación; focal 39/39, typecheck y lint focal OK. Visual dirigido de error/stale/detalle/forbidden 4/4 sin actualizar snapshots. `git diff --check` focal OK.

## Delta de confirmación Candidate `b420c027`

- `ConfirmationDialog` incorpora appearance golden reutilizable; FE-004 delega bloquear/reactivar con header/body/footer semánticos, `aria-describedby`, Cancelar como foco inicial y primer control DOM, retorno al menú, busy locks, etiquetas Bloqueando/Reactivando y `CorrelationId` validado dentro del alert.
- `ModalSurface` añade solo la variante opt-in bottom-sheet: móvil al borde inferior/ancho completo/radios superiores; desktop preserva diálogo centrado. Se retiró CSS manual de confirmación FE-004. El panel usa `--visual-radius-lg:16px`, `overflow:hidden`; el footer de tabla golden no aporta sombra, margen, radio ni borde externo salvo superior.
- Comparación manual de confirm-block desktop/mobile y reactivate con sus capturas aprobadas antes de promover 3 baselines; confirm-dark ya coincidía. Evidencia: focal 25/25, typecheck, lint focal y build OK; visual ready/tablet/390/dark + 4 confirmaciones 8/8 sin update; `git diff --check` focal OK. Build conserva aviso conocido de chunks >500 kB.
