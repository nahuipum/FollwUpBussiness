# VISUAL-CLEANUP-2026-10-01 · Development handoff

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `359cc48+b43fa14876fd`
- **Ámbito:** `frontend/followupbussiness`; sin cambios de negocio, contratos, permisos, rutas, sesión ni caché.

## Resultado

- **Migrados:** `src/shared/ui/date-filter-field.css`, `modal-async-state.css`, `modal-header.css` y `operation-dialog.css`. Sus referencias legacy `--theme-*` se sustituyeron por tokens `--visual-*` equivalentes; se conservan APIs, variantes, foco, estados asíncronos y diálogos.
- **Eliminados:** ninguno. La auditoría pre/post con `rg` halló consumidores estáticos de cada candidato en features/pruebas y ninguna carga `import()`/`lazy` de UI no resuelta. También se verificaron configuración Vite/TS, `index.html`, assets y `url()` CSS.
- **Conservados:** `global.css`/`theme.css`, familias `default` y CSS/primitivas compartidas restantes: continúan activos para compatibilidad de pantallas y pruebas; retirarlos excedería una limpieza segura. Los logos, worker y estilos de mapas también tienen consumidores/imports reales.

## Evidencia y validación

- Mockups consultados: `docs/frontendMockups/_design-system.html`, `_application-shell.html`.
- Referencias post-migración: `rg -- '--theme-'` no devuelve coincidencias en las cuatro hojas migradas; imports y consumidores de `DateFilterField`, `ModalAsyncState`, `ModalHeader`, `OperationDialog` y `ConfirmationDialog` permanecen localizados.
- `npx vitest run src/shared/ui/{DateFilterField,ModalAsyncState,ModalHeader,ConfirmationDialog}.test.tsx --environment jsdom`: 4 archivos, 11 pruebas OK.
- `npm run typecheck`, `npm run lint`, `npm run build`: OK. Lint conserva 3 advertencias preexistentes de dependencias `key` en mapas; build conserva advertencia de chunks grandes.
- Revisión visual manual automatizada viable: `npx playwright test tests/visual/client-filters.visual.spec.ts`: desktop y móvil OK. `git diff --check -- frontend/followupbussiness`: OK.

## Riesgos y reproducción

- Riesgo residual: queda deuda legacy activa fuera de estas cuatro hojas; no es un huérfano demostrable. QA debe confirmar tema claro/oscuro, filtro de fecha y diálogos en las rutas consumidoras, además de los estados/roles definidos en el paquete.
- Reproducción: iniciar sesión como `COMPANY_ADMIN`, abrir Clientes y sus filtros; validar selector de fecha, abrir un formulario/diálogo y alternar tema. No se expusieron datos ni secretos.
