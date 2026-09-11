# Contexto — migración golden de Vendedores (FE-005/FE-006/FE-007)

## Estado

- Fase autorizada: DoF — candidata final tras Development, QA y Seguridad en PASS.
- Candidate-ID: `03933fa + d86ef854`.
- Referencia visual exacta y protegida: `docs/frontendMockups/FE-005.html` (no modificar ni importar en producción).
- Sistema visual consultado: `docs/frontendMockups/_design-system.html`, `_application-shell.html` y `assets/golden-system.css`.
- Contrato consultado: operaciones y schemas de vendedores en `docs/api/openapi.yaml`.

## Objetivo y alcance

Migrar el contenido completo de `/company/sellers` al golden FE-005 con React/TypeScript mantenible. Conservar rutas, autenticación, tenant, API, paginación/filtros server-side, correlation IDs, validaciones, guards y semántica funcional. No agregar eliminación, métricas/FE-021, datos simulados ni campos mutables no respaldados por contrato. El application shell queda protegido.

Rutas principales: `frontend/followupbussiness/src/features/company-sellers/**`; primitives compartidos bajo `src/shared/ui/**` solo mediante variantes reutilizables y compatibles con consumidores existentes; pruebas visuales bajo `tests/visual/**`.

## Contratos e invariantes

1. `COMPANY_ADMIN` puede crear, editar perfil mutable, asignar supervisor/territorios, reenviar invitación y activar/inactivar. `SUPERVISOR` solo lista, filtra, pagina y ve detalle. Ocultar acciones acompaña, pero no sustituye, guards funcionales.
2. Listado: `GET /sellers` con `page`, `pageSize`, `search`, `status`, `supervisorId`, `territoryId`; conservar resultados previos durante refresh/error recuperable. Cambio de sesión/empresa limpia lista, filtros, PII y operaciones obsoletas.
3. Crear: `POST /sellers`, 202 significa vendedor creado e invitación aceptada. Editar: `PATCH /sellers/{id}` solo `displayName`, `phone`, `employeeCode`, con `If-Match`; correo, username y asignaciones no son editables allí.
4. Reenvío: solo `INVITED`, `POST .../invitation` con `If-Match`; 202 significa aceptada para entrega, no entregada. Estado: `PATCH .../status`, motivo 5–500; una inactivación conflictiva por jornada/recorrido activo no actualiza fila ni cierra contexto. Asignaciones usan endpoints separados y territorios requieren al menos uno.
5. Rechazo/conflicto/red/respuesta obsoleta no muestra éxito ni muta datos. No enviar tenant en payload ni registrar PII. Mostrar correlation ID validado donde exista. Durante busy bloquear doble submit y cierre accidental.

## Composición y estados obligatorios

- Header: eyebrow “Equipo comercial”, título, descripción y CTA solo admin.
- Panel: aviso read-only para supervisor; filterbar con labels; header “Resultados”; tabla exacta Vendedor/Teléfono/Zona-territorio/Supervisor/Estado/Acciones; tags de territorios; menús por estado; footer estático dentro del flujo, divisor único, rango real, hora, page-size 5/10/15/20 y paginación con vecinos/elipsis.
- Usar variantes golden de `VisualSelect`, `DataTable`, `DataTableIdentity`, `DataTableStatus`, `DataTablePagination`, `TableActionMenu`, `ReadOnlyNotice`, `AsyncStateCard`, `TableLoadingIndicator`, `DrawerSurface`, `ConfirmationDialog` y `OperationDialog`; adaptar primitives compartidos cuando falte una capacidad, sin duplicarlos.
- Drawers golden: crear, editar, detalle, supervisor, territorios; body con scroll y footer persistente. Selector de territorios buscable con chips y portal. Diálogos/bottom sheets: activar/inactivar y reenviar. Foco atrapado, Escape cuando no busy, retorno al disparador, labels, aria de menús, errores/resultados anunciados y reduced motion.
- Estados: loading inicial; ready; refreshing conservando datos; empty; no-results; error con/sin datos y retry; forbidden; loading/empty/error de catálogos; validación; submitting; negocio; concurrencia; éxito; red; invitación asíncrona; dark; 1440/1024/768/390.

## Auditoría comparativa y corrección actual

- Render previo en 1440×900, 1024×768, 768×1024 y 390×844 confirma que el panel/tabla corta estado y acciones, las proporciones de columnas no corresponden, “Resultados” carece de la jerarquía de dos líneas y los filtros móviles permanecen en dos columnas.
- `data-table.css` y `multi-select.css` definen primero bases hardcodeadas turquesa; sus variantes golden solo sobrescriben una parte, por lo que heredan geometría, estados y colores legacy. `VisualSelect` y `TableActionMenu` tienen el mismo riesgo parcial.
- El `MultiSelect` golden sigue siendo un select genérico con checkbox nativo, resumen por label, buscador sin icono/copy, botón “Listo” y sin metadata. Debe replicar `territory-picker`: código/nombre, “Territorio activo”, check visual, chips, vacío y footer de coincidencias/total.
- El popover usa portal `position: fixed` y `z-index:60`, igual que el drawer; siempre abre debajo. Debe medir trigger/contenido, abrir arriba o abajo, limitar solo la lista, clamar ejes a 12–14 px, recalcular en scroll/resize/ResizeObserver y usar una capa documentada superior al drawer sin valores desproporcionados.
- Reutilizar shell y primitives existentes; hacer las variantes golden autosuficientes sin alterar `default`, porque `MultiSelect` default aún lo usan cartera/rutas y `DataTable` default lo usan empresas, clientes, territorios, rutas y cartera.
- Ajustar tabla/cards, filtros, footer/paginación, drawers, diálogos y menús a FE-005 sin cambiar hooks/API/guards. Eliminar reglas sin consumidores y aislar las legacy aún usadas.

## Verificación exigida

Ampliar pruebas de `MultiSelect` (golden/default, búsqueda, vacío, chips, teclado, flip arriba/abajo, límites, resize/scroll, foco) y `DataTable` (aislamiento golden/default, columnas, cards y paginación). Ejecutar pruebas compartidas, Vendedores, consumidores directos, suite, typecheck, lint y build. Comparar mockup/React en los cuatro viewports para listado, tabla, tres menús, cinco drawers, selector abierto/seleccionado/cerca del borde, confirmaciones, conflicto y estados. La prueba visual debe comprobar límites del viewport, buscador/footer visibles, selección, Escape y retorno de foco. Ejecutar `git diff --check`.
