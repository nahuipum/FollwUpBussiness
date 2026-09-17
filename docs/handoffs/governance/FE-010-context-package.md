# FE-010 — Paquete de contexto

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD 574be0e + FE010_SCOPE_SHA256 b9160c0d43a5d72ccf1bbd30db2044b3af6d050e70d63a58014a34b66eeac87b + FE010_POPUP_SHA256 8233870fc653c64cf8a3fdfde4ffab01fa33e12519e3aaa8bcd1f3627d911f89 (5 archivos)`

## Objetivo y fuente visual

Migrar `/company/clients/map` y `/supervisor/clients/map` al sistema golden, con fidelidad al mockup inmutable `docs/frontendMockups/FE-010.html`. Referencias consultadas: `FE-008.html`, `_design-system.html`, `_application-shell.html`, `assets/golden-system.css`, `FE-004.html`, `FE-005.html`, `FE-037.html`; historias FE-010, FE-008, FE-009 e INT-005. No modificar mockups, contratos, Backend ni application shell.

## Inventario previo y regiones protegidas

- Preservar `listAllClients`, acumulación de páginas autorizadas, filtros server-side, descarte de respuestas obsoletas, `correlationId`, stale/última actualización, limpieza por sesión/empresa, rutas y roles.
- Administrador: solo empresa actual. Supervisor: solo carteras vigentes de vendedores asignados; vacío sin ampliar alcance. El cliente nunca aporta tenant/empresa/supervisor/vendedor/roles/equipo como autoridad.
- Una sola selección compartida mapa–lista; drag/pan no limpia; selección desde marcador revela la fila sin mover foco; limpiar selección no limpia filtros.
- No exponer contacto, dirección completa, IDs internos, coordenadas ni datos fuera de alcance en lista, popup, errores, marcadores o totales.
- Fuera de alcance: Gestión/formulario/detalle de clientes, Carga, Asignar cartera, rutas, navegación global y reglas funcionales/API/DTO.

## Composición y estados obligatorios

Cabecera: eyebrow `Cartera comercial`, título, descripción aprobada y última actualización si existe. Un único panel: toolbar, alertas/actualización, workspace con mapa dominante y lista lateral; a 1060 px apilar mapa/lista y a 620 px usar layout móvil. No paginación visual ni tarjetas separadas.

Filtros exactos: búsqueda `Buscar por nombre o segmento` / `Nombre o segmento`, Estado, Sin visita desde y Sin compra desde. Reusar `DataTableToolbar`, `SearchField`, `FilterField`, `VisualSelect` y `DateFilterField`; overlays en portal, opacos, accesibles y dentro del viewport.

Estados inventariados: ready admin/supervisor; loading inicial; refreshing; filtros activos; no-results; empty admin/supervisor; initial-error; refresh-error-stale; forbidden; map loading/active/provider-error/unconfigured; marker active/inactive/selected; selected from list/marker; status/date overlays; long-list/long-name; mobile ready/selected/provider-error; dark. Mantener lista y filtros operativos cuando falla/no está configurado el mapa.

## Arquitectura de mapa

Duplicación real actual: carga dinámica de MapLibre y worker, URL Geoapify con clave codificada, imagen faltante, estado `LOADING/ACTIVE/LIMITED/DISABLED`, lifecycle/cleanup/retry. Extraer solo una base/hook/utilidad pequeña si reduce esa duplicación sin convertir `ClientLocationMap` en componente condicional gigante.

Mantener separados:

- `ClientMap`: múltiples marcadores, popup seguro con nombre/segmento/estado, selección/foco, lista alternativa.
- `ClientLocationMap`: un marcador, draggable/readonly, selección y confirmación de coordenadas de FE-008/FE-009.

`RouteSequenceMap` es región protegida; solo adaptar a una utilidad realmente compartida si no cambia su comportamiento.

## CSS residual

El bloque actual `client-map-page`, `client-map*` y `client-map-list*` contiene cards, círculos y colores hardcodeados legacy, además del comentario temporal “región protegida”. Sustituir por tokens golden y conservar únicamente CSS específico de mapa, lista, popup, selección, estados y responsive. Buscar consumidores antes de borrar y no eliminar estilos de `ClientLocationMap`.

## Pruebas y cierre de Desarrollo

Actualizar unitarias de página/hook/API/mapas para autorización, filtros, páginas, obsolescencia, sesión, selección bidireccional, drag, marcador/popup seguro, virtualización, estados de datos/proveedor, retry y cleanup. Crear `tests/visual/company-clients-map.visual.spec.ts` con red/datos y mapa estabilizados; cubrir estados pedidos, 1440×900, 1280×800, tablet, 390×844 y dark. Ejecutar pruebas focalizadas, regresión FE-008, visual FE-010/FE-008, lint, typecheck y build/CI equivalente. Comparar mockup/app lado a lado y corregir diferencias relevantes. No actualizar snapshots sin inspección ni hacer commit.

## Delta de Desarrollo

- Mapa golden con toolbar compartida, selección mapa–lista virtualizada, pan sin limpiar selección y fallback de proveedor operativo; se preservan carga autorizada, filtros, descarte obsoleto y limpieza por sesión/empresa del hook existente.
- Se extrajo `maplibre-loader.ts` para carga/worker compartidos por `ClientMap` y `ClientLocationMap` (regresión FE-008). Se añadieron pruebas unitarias y la especificación visual FE-010; las baselines visuales faltan y no se generaron sin inspección.

## Delta de remediación QA

- Se restauró el título exacto, se aplicaron breakpoints 1180/1060/620 y se sustituyeron residuos hardcodeados de popup/lista/scroll/marcadores por tokens golden; el pin conserva forma y estados accesibles.
- Baselines FE-010 generadas tras inspección de tablet contra el mockup (5 escenas: 1440, 1280, tablet, móvil y dark). La ejecución visual FE-008 disponible tuvo una diferencia de 0,01% en un snapshot de detalle ajeno al mapa.

## Delta de remediación Development final

- Se fijó el reloj del fixture y se eliminaron esperas temporales arbitrarias. La matriz visual usa un estilo MapLibre mínimo interceptado para validar mapa activo, marcadores y selección sin depender de mosaicos remotos; el fallo de proveedor se aborta de forma separada y la falta de configuración corre aislada con clave vacía.
- Se añadieron baselines para los estados requeridos y se inspeccionaron 1440, tablet, móvil y oscuro. FE-008 estabiliza el detalle esperando su marcador; la baseline se actualizó tras comprobar que los 242 píxeles eran el estado de carga transitorio del mapa, sin cambio de datos ni composición.

## Delta de corrección de marcador

- `createMapMarker` centraliza el DOM y la geometría aprobada del pin para ambos mapas. El botón de `ClientMap` mantiene nombre/estado, `aria-pressed`, click y modificadores `active`, `inactive`, `selected` y `focus`; sus colores y foco se dibujan exclusivamente sobre el pseudo-elemento del pin. `ClientLocationMap` conserva el `span` con `aria-hidden`, `anchor: bottom`, arrastre/consulta y coordenadas.
- Se inspeccionó el diff visual 1440: las diferencias eran exclusivamente la eliminación del rectángulo de fondo y la forma común del pin. Se actualizaron 10 baselines FE-010 afectadas y pasaron FE-010 normal (15/15 aplicables, 1 skip previsto), no configurado (1/1) y FE-008 (13/13).
- La escena de selección ahora observa por `MutationObserver` el ciclo `LOADING → ACTIVE` posterior al click y el marcador seleccionado antes de capturar. Tras inspeccionar expected/actual/diff, se actualizó únicamente `company-clients-map-selected`: la baseline previa mostraba la carga transitoria; la nueva muestra popup, columna y pin ya estables.

## Delta de anclaje de marcador

- `.map-marker` vuelve a ser `position: absolute`, por lo que no sobrescribe la regla de `.maplibregl-marker`; MapLibre conserva su `transform` inline y el ancla inferior. No cambian pseudo-elementos, geometría, accesibilidad ni callbacks.
- La regresión visual usa dos coordenadas distintas y verifica `position:absolute`, el `translate(...)` gestionado por MapLibre y su actualización al acercar/alejar. El fixture de lista extensa ahora distribuye coordenadas distintas; se inspeccionaron sus diferencias (solo pins reubicados) y se regeneraron `long-inactive` y `selected`.

## Firma de candidato

La firma actual incluye los cambios FE-010 rastreados, componentes compartidos consumidos, la spec visual y sus 16 baselines ignoradas: SHA-256 de líneas ordenadas `ruta:SHA-256(contenido)`.

## Delta de popup seleccionado

- El popup continúa representando la selección mapa–lista. MapLibre decide el anclaje dinámico sin `anchor` forzado; los offsets por ancla respetan el pin, `maxWidth` responde al viewport y `focusAfterOpen:false` preserva el foco actual.
- Solo expone nombre, segmento o `Sin segmento` y estado mediante `textContent`/`setDOMContent`. El diseño golden queda opaco, alineado a la izquierda, con nombre de hasta dos líneas, badge secundario y puntas para anclajes cardinales y de esquina.
- La firma `FE010_POPUP_SHA256` cubre `ClientMap`, su unitaria, CSS, spec visual y baseline seleccionada regenerada tras inspección.
