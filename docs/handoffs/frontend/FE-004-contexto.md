# FE-004 — Paquete de contexto de migración visual

**Estado actual:** `READY_FOR_HANDOFF`
**Candidate-ID:** `ceb2c20+8af0333a`.
**Mockup exacto protegido:** `docs/frontendMockups/FE-004.html` (no modificar ni importar en producción).

## Objetivo y límites

Migrar únicamente el contenido interior de `/company/administrators-supervisors` al sistema golden aprobado, reproduciendo composición, jerarquía, estados, responsive y dark mode de `FE-004.html`. El shell (`DashboardLayout`, sidebar, topbar, breadcrumbs, perfil, tema y drawer móvil) ya está migrado y queda fuera salvo una incompatibilidad demostrable. Preservar la integración productiva actual, sesión, tenant, concurrencia, versionado, accesibilidad y Backend como autoridad. No cambiar Backend, OpenAPI ni mockups.

## Contrato e invariantes

- `GET /company/users`: `COMPANY_ADMIN|SUPERVISOR`, paginación real con `page/pageSize`, `search`, `role`, `status`; no simular paginación cliente.
- `POST /company/users`, `PATCH /company/users/{userId}`, `PATCH /company/users/{userId}/status` y `POST /company/users/{userId}/invitation`: solo `COMPANY_ADMIN`. Edición y reenvío usan `If-Match`/`version`; reenvío solo para `INVITED` y 202 significa “aceptada para entrega”, no correo entregado.
- `GET /company/users/{userId}`: solo `COMPANY_ADMIN`; un supervisor no recibe columna/menú de acciones ni detalle. El contrato no ofrece eliminación.
- Estado visible: `ACTIVE` success, `INVITED` warning, `INACTIVE` neutral, `LOCKED` danger. Invitación pendiente ofrece detalle y corrección/reenvío; no edición normal. El endpoint de estado admite valores amplios, pero historia y UI solo justifican bloquear cuentas activas y reactivar `LOCKED|INACTIVE`; no se ofrece bloqueo de `INVITED` sin evidencia adicional.
- Rechazo/conflicto/no-op/respuesta obsoleta no muestra éxito ni altera datos. Durante mutaciones: doble submit y cierre accidental bloqueados; conservar valores. Cambiar usuario/empresa o cerrar sesión limpia lista, filtros, PII, diálogos, errores y solicitudes/mutaciones obsoletas.
- No enviar tenant/company en payload; no registrar PII, tokens, credenciales, enlaces o invitaciones.

## Presentación y estados

Encabezado: eyebrow “Equipo y accesos”, título y descripción exactos; CTA azul con `Plus`, solo admin y full-width móvil. Panel: filtros con labels visibles y `VisualSelect`, búsqueda con debounce, filtros Backend y reset a página cero. Encabezado interno “Resultados” más total.

Tabla con `DataTable`, `DataTableIdentity`, `DataTableStatus` y `DataTablePagination` cuando sean compatibles; acciones accesibles y flotantes sin recorte, cierre por selección/outside/Escape, flechas, foco y retorno. Paginación: rango/mostrados, total, última actualización, tamaños 5/10/15/20, anterior/actual/siguiente, correcta para 100+ registros.

Estados obligatorios: loading inicial con skeleton/`aria-busy`; ready; empty con CTA solo admin; no-results con limpieza integral; error sin datos; error con datos previos conservados, aviso y “Actualización pendiente”; forbidden sin PII previa; read-only supervisor.

Anatomía de overlays no negociable según `FE-004.html`: invitación, edición y corrección/reenvío usan un **drawer lateral derecho** compartido; el detalle (loading/ready/error) usa el mismo primitive de **drawer**; bloquear y reactivar usan un **dialog centrado** breve (`alertdialog` cuando corresponde); los menús siguen siendo **popovers anclados**. El drawer tiene portal a `body`, scrim, ancho desktop aproximado de 500 px, header independiente, body desplazable, footer persistente separado, ancho completo móvil, dark mode y reduced motion. Todos los overlays conservan focus trap, foco inicial, Escape solo si no hay busy, retorno al disparador, bloqueo/restauración del scroll del documento y controles de 44 px. No convertir globalmente `ModalSurface`, que mantiene consumidores externos.

Los formularios conservan validaciones y errores 401/403/404/409/422/500/503 con `correlationId`. Bloqueo explica pérdida de acceso y revocación de sesiones respaldada por contrato; reactivación usa botón primario azul.

Responsive exacto: 1440×900; 900×900 con búsqueda arriba y selects debajo; 390×844 y 360×800 con header/filtros/paginación apilados, tabla convertida en tarjetas, acciones arriba, menú en viewport, drawer a ancho completo con body scrollable y footer accesible, dialog de confirmación responsive y controles ≥44px, sin scroll horizontal. Dark mode y foco usan exclusivamente `--visual-*`; respetar reduced motion.

## Auditoría visual integral previa

| Región | Mockup aprobado | Implementación actual | Diferencia demostrada | Corrección requerida |
| --- | --- | --- | --- | --- |
| Encabezado | Eyebrow, título, descripción y CTA `Plus` alineados con la retícula golden; CTA apilado y full-width en móvil. | Textos correctos, pero geometría, tipografía, separación y dimensiones dependen aún del CSS FE-004 previo. | Fidelidad parcial de espaciado, radio y responsive. | Reproducir medidas y composición de `FE-004.html` con tokens `--visual-*`, sin tocar el shell. |
| Filtros y buscador | Label visible; control de búsqueda de 44 px con icono dentro del borde; grid ancho + dos selects, tablet 1+2 y móvil 1 columna. | El icono ocupa una celda propia y el input cruza el grid; `VisualSelect` usa blancos, teal y bordes legacy. | Icono fuera del control y selects sin dark mode golden. | Crear control flex estable y variante golden opt-in de `VisualSelect`; activar solo en FE-004 y paginación FE-004. |
| Panel y resultados | Un panel con filtros, alert stale, cabecera `Resultados`/total/actualización, tabla o estado, y paginación. | El panel contiene filtros y contenido, pero no existe cabecera interna de resultados; stale vive fuera. | Jerarquía, altura y bordes no coinciden; total solo aparece abajo. | Añadir cabecera interna estable, total real y `Actualización pendiente`; ubicar stale dentro del panel. |
| Tabla, identidad y badges | Head uppercase 11/16/.05em; filas ~54 px; columnas 36/16/19/22/72; identidad 34×34 sin gradiente; badges 26 px sin borde. | `DataTable` conserva tipografía, colores y gradiente teal; anchos 34/17/26/16/12 exceden una distribución coherente; badges con borde/padding legacy. | Toda la anatomía visual central sigue siendo legacy. | Variantes golden opt-in para tabla, identidad y estado, proporciones exactas y tarjetas móviles del mockup. |
| Acciones y menú | Botón 36×36 transparente (44 móvil) y popover anclado golden, dentro del viewport. | Semántica/teclado están conservados, pero botón y `TableActionMenu` usan teal, blancos y sombras legacy. | Apariencia y dark mode incorrectos. | Variante golden opt-in del menú y del action button, preservando portal/posición/Escape/outside/foco. |
| Paginación | Rango real `Mostrando 1–5 de 128 usuarios`; `Actualizado hoy, 10:42`; anterior, actual, elipsis, última y siguiente. | Muestra cantidad de la página, hora con formato local no controlado y solo anterior/actual/siguiente; actual teal sólido. | Información funcional/visual incompleta para 100+ registros. | Extender `DataTablePagination` con variante golden, rango real, formato determinista y navegación resumida sin paginación cliente. |
| Loading y estados | Cabecera `Resultados` estable, cinco filas skeleton y `aria-busy`; cards con iconos Users/Search/Alert; stale conserva tabla. | Spinner central de 300 px y `AsyncStateCard` legacy; error sin datos puede coexistir con panel; stale exterior. | Snapshot ready puede capturar loading y hay salto de layout; estados no reproducen el mockup. | Skeleton golden específico/variante, estados golden opt-in, render mutuamente exclusivo y espera visual por contenido semántico. |
| Solo lectura | Notice info con `Eye`, título y explicación completa; sin CTA ni acciones. | Texto genérico corto y estilos hardcodeados. | Contenido y anatomía divergentes. | Variante/contenido golden en FE-004, manteniendo listado/filtros/paginación y omitiendo acciones. |
| Mobile y dark | Tarjetas con identidad superior/divisor/labels uppercase/acción en esquina; paginación apilada; todos los tokens golden. | Responsive cards existe, pero deriva de `data-table.css` legacy; primitives mantienen hardcodes claros/teal. | Geometría y contraste no corresponden a capturas 390/360/dark. | Aplicar variante golden completa y verificar sin scroll horizontal en ambas resoluciones y dark. |
| Overlays | Formularios/detalle en drawer derecho; confirmaciones breves centradas; detalle ready en cards de definición. | Drawers y confirmaciones ya están correctamente separados, pero detalle ready aún usa filas planas y varios acabados no coinciden. | Corrección anterior resolvió posición, no fidelidad completa. | Conservar flujos y primitive; completar header/body/footer, definición-grid, tokens y dialogs, sin volver a modales centrados. |

La evidencia base son el HTML y las capturas aprobadas. Los snapshots Playwright actuales quedan invalidados como baseline hasta que una captura ready espere `aria-busy` ausente, cinco filas exactas, cabecera `Resultados` y paginación, y se compare manualmente con las capturas del mockup.

## Delta de Desarrollo

Se completó la variante golden opt-in: hover tokenizado de filas, controles/meta/paginación, select de tamaño y estados neutros; el skeleton usa shimmer y desactiva animación con reduced motion. Las operaciones de usuarios suprimen el error global porque el feature ya presenta sus errores locales; así un refetch 500 conserva tabla y muestra stale. Se añadieron pruebas de primitives default/golden y matriz visual determinista para loading y 200 inicial + refetch 500.

Remediación QA: el 403 ahora es un estado local aislado, sin shell de tabla, filtros, CTA ni PII; usa el copy aprobado y retorno al resumen. El 401 limpia datos previos y tiene regresión. Loading muestra “Cargando usuarios” y cinco filas skeleton por columnas; las fechas siguen Hoy/Ayer/d MMM HH:mm.

Remediación visual final: toolbar, empty/no-results, readonly, dark, tabla y metadata se compararon directamente con las capturas aprobadas; se ajustaron alturas, tokens y copys antes de regenerar baselines actuales.

Cierre final: la paginación ahora representa primera/intermedia/última/única como `‹ 1 … 26 ›` cuando corresponde; empty incorpora `Plus`. Se eliminaron selectores dark residuales sin consumidores de diálogos/detalles/preview/person/paginación y el notice legacy quedó limitado a `--default`. Baselines base afectados fueron capturados con servidor Vite limpio, fixtures Marina/Julián, Comercial Andina y Alex Medina; matriz visual completa verificable sin actualización.

Delta final: metadata de paginación golden se apila, el page-size mide 154 px en desktop y se adapta a todo el ancho móvil; elipsis y controles permanecen visibles. La hora se formatea sin meridiano. El stale conserva el `page` de la respuesta previa, el detalle simula un 500 real y la prueba stale se fija a 1440 px. `theme.css` ya no referencia `.company-users__search`; el cálculo de posición de `VisualSelect` mantiene dependencia acotada a `open` y `options.length`. Baselines afectados se regeneraron tras comparación y pasan sin actualización.

Remediación Security SEC-FE004-01/02: `apiRequest` admite un predicado; company-users publica exclusivamente 401 para que el manejador global invalide sesión y PII, mientras los demás fallos permanecen locales. Se separó `mutationError` del error de listado y el `correlationId` validado se muestra en lista/stale, formulario, detalle y confirmación; valores hostiles se omiten.

Delta de confirmación: `ConfirmationDialog appearance="golden"` reemplaza el diálogo manual de estado con header/body/footer, `aria-describedby`, foco inicial/retorno, error y `CorrelationId`. En móvil es bottom sheet de ancho completo con radio solo superior y Cancelar antes de confirmar. El panel tiene radio tokenizado de 16 px y overflow oculto; la paginación golden es continua, estática y solo conserva borde superior.

Validación final del delta: el overlay usa `--visual-overlay`; header 20/22/16, cierre de 44 px con borde y foco tokenizado, y error dentro del body con título, mensaje y `correlationId`. Reactivar deriva el rol real del usuario y ambos flujos anuncian `Bloqueando…`/`Reactivando…`; backdrop y Escape se deshabilitan durante busy. El peligro conserva `#b42318` también en dark. El panel usa `--visual-radius-lg` y `overflow: hidden`; el footer golden permanece estático, sin sombra/margen/bordes externos. La spec conserva únicamente los cuatro snapshots canónicos block/reactivate.

Delta de contraste: `--visual-on-danger: #ffffff` queda definido tanto en light como dark y cubierto por aserción Playwright de color computado. La comparación manual confirmó que los 420 píxeles corregidos corresponden solo al texto negro→blanco del botón peligroso; los cuatro visuales de confirmación pasan sin actualizar baseline.

Se añadió la cabecera semántica de resultados, rango real y cinco fixtures `.example`; el detalle listo usa `definition-grid` de cuatro tarjetas y badge tokenizado. La comparación manual de `fe-004-detail-ready-desktop.png` contra el baseline actual confirmó divergencia visual material en geometría de tabla, identidad, badges y shell; no se promovieron snapshots. Cierre: completar variantes golden opt-in de tabla/paginación/estados y comparar todas las capturas antes de actualizar baselines.

## Inventario previo y protección del worktree

`git status --short` muestra cambios ajenos en shell, auth, dashboard, plataforma, `theme.css`, mockups/activos y pruebas visuales. No revertirlos. El diff inicial no contiene cambios en `src/features/company-users/**` ni en los primitives enumerados; `theme.css` sí tiene migración ajena y solo admite un parche mínimo que preserve el diff actual.

- **ELIMINAR si la búsqueda final confirma cero consumidores:** `.company-users__preview`, `.company-users__pagination`, `.company-users-brand`, `.company-users__person`, `.company-users__avatar`, `CompanyUserInviteDialog`, `CompanyUserDetailDialog`, `.company-users__dialog` de formularios/detalle, backdrop/media queries sustituidos, imports/props/tipos huérfanos y colores/gradientes legacy.
- **CONSOLIDAR:** tabla, identidad, estados, paginación, action menu; formulario en `CompanyUserFormDrawer`, detalle en `CompanyUserDetailDrawer` y anatomía/foco/scroll mediante `DrawerSurface` reutilizable. Mantener confirmación centrada con `ModalSurface` o variante explícita compatible.
- **MANTENER:** hooks de sesión/concurrencia, debounce, requests Backend, `If-Match`, stale data, focus/accessibility y componentes compartidos con consumidores en otras features.
- **REVISIÓN MANUAL:** cualquier cambio compartido en `DataTable*`, `TableActionMenu`, modales, `dashboard-primitives*` o `theme.css`; comprobar consumidores con `rg` y regresión del shell.

## Evidencia esperada

Ampliar `CompanyUsersPageRoute.test.tsx` con estados, flujos, permisos y teclado descritos, incluyendo drawers a la derecha para invitar/editar/reenviar/detalle, dialog centrado para bloquear/reactivar, focus trap/retorno, bloqueo busy, footer separado y mobile full-width. Crear/actualizar `tests/visual/company-users.visual.spec.ts` con datos `.example` deterministas. Comparar manualmente primero contra `fe-004-invite-{desktop,mobile,dark}`, `fe-004-edit-desktop`, `fe-004-detail-{loading,ready,error}-desktop`, `fe-004-confirm-block-{desktop,mobile,dark}` y `fe-004-confirm-reactivate-desktop`; los snapshots actuales no son evidencia y no se promueven a ciegas. Ejecutar, desde Frontend: prueba focalizada, typecheck, lint focalizado, build, visual FE-004, visual shell y `git diff --check`.
