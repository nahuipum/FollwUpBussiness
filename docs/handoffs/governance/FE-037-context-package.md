# FE-037 — Paquete de contexto

**Estado:** DEVELOPMENT_READY_FOR_HANDOFF  
**Candidate-ID:** `574be0e+dde667d7`

## Precondición y comparación renderizada (reanudación)

Precondición cumplida: `src/shared/ui/DataTableWorkspace.tsx` aporta `DataTablePanel`, `DataTableToolbar`, `SearchField` y `DataTableResultsHeader`; `FilterField`, `DataTable` y `DataTablePagination` completan el workspace. Administradores y Vendedores ya lo consumen y existe `tests/visual/table-workspace-contract.visual.spec.ts`. Se preservan esos cambios previos sin commit. Comparación inicial renderizada a 1440×900: `FE-037.html?state=ready-admin` frente a la app real antes de esta corrección.

| Elemento | Mockup | Implementación antes de corregir | Compartido aplicable | Corrección |
|---|---|---|---|---|
| Page header | Eyebrow/título/copia/CTA golden | Cercano, condicionado por CSS local | Header de feature + tokens | Ajustar solo composición específica |
| Panel | Una superficie canónica | `territory-list__card` local | `DataTablePanel` | Reemplazar |
| Filtros | Grid golden de 2 controles | Toolbar/search/filter locales | `DataTableToolbar`, `SearchField`, `FilterField` | Reemplazar |
| Solo lectura | Aviso tras filtros | Aviso dentro del panel local | `ReadOnlyNotice` | Reordenar y validar |
| Error stale | Alerta sin vaciar tabla | Bloque local después del footer | Results/status + alerta | Integrar sin superposición |
| Resultados | 54px, `Resultados`, `N zonas`, refreshing | Header local y `N zonas registradas` | `DataTableResultsHeader` | Reemplazar |
| Tabla | Proporciones/datos golden | `DataTable` con decisiones visuales locales | `DataTable` | Dejar solo adaptador de columnas |
| Badges | Activa verde, Inactiva danger | Inactiva warning | `DataTableStatus` | Corregir tono |
| Conteos | Peso/alineación del mockup | `<strong>` local | Columna `DataTable` | Quitar énfasis local |
| Menú | Portal golden, solo Editar | Compartido golden | `TableActionMenu` | Mantener y probar ambos estados |
| Footer | 61–65/128, pág. 13/26 | Compartido, fixture pág. 1/2 filas | `DataTablePagination` | Usar metadata/fixture intermedio |
| Drawer | 500px, copy/contexto/ayudas exactos | Drawer con contenido incompleto | `DrawerSurface` | Adaptar contenido, no superficie |
| Formulario | Placeholders, ayudas, contadores y errores | Error reducido a string | Drawer + error UI | Completar con `ApiError` público |
| Selector estado | Golden y open/saving | `VisualSelect` golden | `VisualSelect` | Mantener y probar |
| Confirmación | Identidad/copy/histórico/saving/error | `ConfirmationDialog` cercano | `ConfirmationDialog` | Ajustar foco y error |
| Mobile | Cards, menú y overlays responsive | Cobertura insuficiente/reglas locales | Responsive compartido | Eliminar reglas generales locales y comparar |

## Delta de cierre requerido

Migrar Zonas al workspace compartido sin tercera variante; eliminar el bloque legacy y reglas locales equivalentes; conservar solo estilos de dominio; diferenciar 409 duplicado/concurrencia con la información pública disponible, además de 404/422/genérico y correlation ID; cubrir todos los estados declarados; añadir Zonas a la homologación computada; comparar mockup y app con los mismos datos/página/tema/viewport; preservar contratos, tenant, sesión, `If-Match`, cancelación y doble-submit. `FE-037.html` permanece inmutable.

## Delta de Desarrollo

Se migró la superficie de zonas a los primitives golden: encabezado, filtros, tabla en tarjetas responsive, paginación, estados, drawer y confirmación accesible. Se preservaron hooks/API, permisos y `If-Match`. Remediación: `TableActionMenu` ahora usa `variant="golden"`, comprobada por clase y snapshot.

Remediación visual cerrada: `company-territories.visual.spec.ts` usa contexto/página limpia por estado, los cinco registros y metadata 13/26. Cubre los 32 estados del mockup con snapshots principales o aserciones transitorias y adjunta comparativos reales app/mockup mediante data URLs. Los errores de listado y mutación quedan contenidos en Zonas (`publishErrors: false`) para conservar el formulario, borrador y correlation ID; pruebas de API actualizadas.

Corrección QA: cada comparativo toma el viewport efectivo de la página y adjunta app/mockup con dimensiones coincidentes para 1440×900, 1024×768, 768×1024 y 390×844. Se añadió creación 422: drawer abierto, borrador intacto, copy de validación y correlation ID público.

## Alcance y fuentes

Migrar visualmente `/company/territories` al golden inmutable `docs/frontendMockups/FE-037.html`, preservando FE-037/BE-062 y OpenAPI `/territories`. Referencias consultadas: `_design-system.html`, `_application-shell.html`, `assets/golden-system.css`, `FE-004.html`, `FE-005.html`, historias FE-037/BE-062, contratos `/territories`, feature `company-territories` y primitives compartidos usados por FE-004/FE-005. No modificar el application shell ni el mockup.

## Matriz inicial de implementación

| Elemento golden | Estado actual | Responsable | Acción |
|---|---|---|---|
| Encabezado | Sin eyebrow; espaciado/CTA legacy turquesa | `CompanyTerritoriesPage` + CSS | Reemplazar |
| CTA | Funcional y oculto a supervisor; visual legacy | Página | Adaptar |
| Panel | Card cercana, pero tokens/radius/overflow legacy | Página + CSS | Reemplazar |
| Filtros | Server-side/reset existentes; faltan labels/composición golden | Página + `VisualSelect` | Adaptar/Reutilizar |
| Tabla | Columnas correctas; falta título/total, variante golden y cards | `TerritoryTable` + `DataTable` | Adaptar/Reutilizar |
| Badges | `DataTableStatus` legacy | `DataTableStatus` | Reutilizar variante golden |
| Menú | Solo Editar y portal existentes; botón legacy | `TableActionMenu` | Adaptar/Reutilizar |
| Footer | En flujo, pero resumen N/Z y estilo legacy | `DataTablePagination` | Adaptar/Reutilizar |
| Paginación | Server-side y selector existentes; rango/elipsis incompletos | `DataTablePagination` | Adaptar/Reutilizar |
| Drawer creación | Modal antiguo; campos/payload correctos | `TerritoryFormDialog` + `DrawerSurface` | Reemplazar/Reutilizar |
| Drawer edición | Modal antiguo; estado y versión conservados | Form + drawer | Reemplazar/Reutilizar |
| Confirmación | Segundo modal artesanal; copia parcial | `ConfirmationDialog` | Reemplazar/Reutilizar |
| Loading | Indicador compartido sin shell golden completo | Página + `TableLoadingIndicator` | Adaptar |
| Refreshing | Conserva tabla, indicador queda bajo ella | Página | Adaptar |
| Empty | Existe genérico | `AsyncStateCard` | Adaptar/Reutilizar |
| No-results | Existe y limpia filtros | `AsyncStateCard` | Adaptar/Reutilizar |
| Error | Reemplaza datos; no refleja stale/error golden | Página + hook | Adaptar |
| Forbidden | Genérico dentro del panel, con Reintentar | Página | Reemplazar |
| Supervisor | Oculta acciones; aviso legacy | `ReadOnlyNotice` | Adaptar/Reutilizar |
| Responsive | Encabezado/toolbar parciales; tabla horizontal inutilizable | Página + `DataTable` cards | Reemplazar/Reutilizar |
| Dark mode | Colores hardcoded y turquesa impiden fidelidad | CSS/tokens golden | Reemplazar |

## Invariantes funcionales y de seguridad

1. `COMPANY_ADMIN` crea/edita; `SUPERVISOR` solo consulta. El UI oculta acciones y los hooks/API mantienen guardas y autorización real.
2. Toda lectura/mutación conserva sesión/empresa, cancelación de respuestas obsoletas y recarga al cambiar identidad/tenant; ningún dato previo cruza de tenant.
3. PATCH conserva `If-Match` con `territory.version`; un conflicto nunca sobrescribe silenciosamente y mantiene el borrador.
4. Rechazos 403/404/409/422/genéricos no generan mutaciones adicionales, eliminaciones, desasignaciones ni efectos fuera del contrato; se muestra correlation ID cuando existe.
5. La inactivación requiere confirmación; no elimina ni altera referencias históricas y solo impide nuevas asignaciones.

## Superficie y validación

Archivos principales: `CompanyTerritoriesPage.tsx`, `TerritoryTable.tsx`, `TerritoryFormDialog.tsx`, hooks/API/types y `company-territories.css`; pruebas unitarias/de página y `tests/visual/company-territories.visual.spec.ts`. Reusar `DataTable`, `DataTablePagination`, `DataTableStatus`, `VisualSelect`, `TableActionMenu`, `DrawerSurface`, `ConfirmationDialog`, `AsyncStateCard`, `TableLoadingIndicator` y `ReadOnlyNotice`. Validar tests focalizados y compartidos, visuales 1440×900/1024×768/768×1024/390×844, lint, typecheck, build y `git diff --check`.
