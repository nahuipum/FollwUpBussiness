# FE-037 — Handoff de QA

**Estado:** CHANGES_REQUIRED  
**Candidate-ID:** `574be0e+dde667d7`

## Auditoría final focalizada

| Hallazgo | Evidencia estructural/estilo | Resultado |
|---|---|---|
| Track vacío en filtros de Zonas | `TerritoryFilters` pasa `filterCount={2}`, pero contiene `SearchField` y un solo `FilterField`. El contrato compartido solo acepta `2 | 3`; a >1060px `data-table-toolbar--2-filters` computa tres tracks: búsqueda + `repeat(2, ...)`. | No conforme |
| CSS local prohibido y redundante | `company-territories.css` conserva `.territory-list .read-only-notice--golden`, `.territory-list .async-state-card--golden` y, en móvil, `.territory-list .data-table--cards tbody tr`. Las dos primeras repiten propiedades de `data-table-workspace.css`; la tercera repite el `padding-right:56px` de `data-table.css`. | No conforme |

## Condiciones observables de cierre

1. Extender el primitive `DataTableToolbar` a `filterCount={1 | 2 | 3}`, definir la grilla compartida `--1-filters` (búsqueda + un filtro) y usar `filterCount={1}` en `TerritoryFilters`; no añadir CSS de Zonas. Ampliar el contrato compartido para 1/2/3 y comprobar a 1440px que Zonas tiene dos tracks ocupados, mientras Administradores/Vendedores conservan sus composiciones.
2. Eliminar los tres selectores descendientes indicados de `company-territories.css`. La apariencia del aviso, estado vacío/error y cards móviles debe quedar gobernada por `DataTableWorkspace`/`DataTable`; cubrirla mediante estilos computados/snapshot focalizado.

## Evidencia

- Inspección de `DataTableWorkspace.tsx`, `data-table-workspace.css`, `TerritoryFilters.tsx`, `company-territories.css` y `data-table.css`.
- `git diff --check` correcto. No se modificó producción durante esta auditoría.

Riesgo directo: divergencia del mockup a escritorio por una columna vacía y una tercera variante visual de Zonas por CSS de feature.
