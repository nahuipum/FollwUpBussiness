# FE-010 — Handoff de Desarrollo

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `HEAD 574be0e + FE010_SCOPE_SHA256 b9160c0d43a5d72ccf1bbd30db2044b3af6d050e70d63a58014a34b66eeac87b + FE010_POPUP_SHA256 8233870fc653c64cf8a3fdfde4ffab01fa33e12519e3aaa8bcd1f3627d911f89 (5 archivos; incluye la baseline seleccionada)`

## Entrega

- La remediación cierra título `Mapa general de clientes`, apilado desde 1060 px y la matriz visual completa de FE-010. El fixture fija reloj y red: mapa activo/markers con estilo MapLibre mínimo, fallo del proveedor por aborto controlado y falta de configuración en ejecución aislada sin clave.
- `tests/visual/company-clients-map.visual.spec.ts` cubre ready admin/supervisor, filtros/no-results, selección, inactivo/lista extensa, loading, vacíos, error inicial, stale, proveedor fallido/no configurado, forbidden, móvil y oscuro. Las baselines 1440, tablet, móvil y oscuro fueron inspeccionadas contra FE-010.
- FE-008 queda en 13/13: `company-clients.visual.spec.ts` espera el marcador de ubicación antes de capturar el detalle. Se actualizó solo esa baseline tras verificar que la desviación de 242 px era la transición visual del loader de MapLibre.
- Se extrajo `components/map-marker.ts`: ambos mapas usan la misma geometría DOM/CSS. El marcador de FE-010 conserva botón, nombre/estado, `aria-pressed`, selección y foco; `active`, `inactive`, `selected` y `focus` modifican solo el pin, sin fondo rectangular. `ClientLocationMap` conserva `span[aria-hidden]`, `anchor: bottom`, arrastre/solo consulta y coordenadas.
- La escena visual de selección registra por `MutationObserver` el ciclo observable `LOADING → ACTIVE` de la nueva instancia y exige el marcador seleccionado antes de capturar. Se inspeccionó su diff: la baseline anterior capturaba el estado de carga; se actualizó únicamente `company-clients-map-selected` con popup, marcadores y columna estables.
- Se corrigió el anclaje geográfico: `.map-marker` es `position:absolute`, de modo que no gana sobre `.maplibregl-marker` ni interfiere con su `transform` inline. La regresión visual verifica ese contrato y un zoom in/out con dos coordenadas distintas; el fixture de lista extensa dejó de apilar clientes artificialmente. Tras inspección, solo se regeneraron las baselines afectadas `long-inactive` y `selected`.

## Contratos y criterios

Sin cambios de API, rutas ni roles. Se mantienen `listAllClients`, acumulación autorizada, control de respuestas obsoletas, `correlationId` y limpieza de sesión/empresa. Lista, filtros y alternativa accesible siguen disponibles ante mapa no configurado o fallido.

## Validación

- Unitarias focalizadas de la corrección: `npm test -- src/features/company-clients/components/ClientMap.test.tsx src/features/company-clients/components/ClientLocationMap.test.tsx` — 11/11.
- Visual FE-010 + regresión FE-008: `npm run test:visual -- company-clients-map.visual.spec.ts company-clients.visual.spec.ts` — 29/29, 1 skip intencional de mapa no configurado. Incluye anclaje durante zoom.
- `npm run typecheck`, `npm run build` y `git diff --check` — correctos. `npm run lint` — 0 errores; persiste un warning ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.

## Riesgos y reproducción

No hay bloqueo conocido. La simulación de mosaicos se limita a pruebas visuales; producción mantiene Geoapify y sus fallbacks. Para reproducir: iniciar sesión como `COMPANY_ADMIN`, abrir `/company/clients/map`, verificar que el pin activo no deja un rectángulo coloreado, enfocarlo con teclado y seleccionar un marcador; la fila se revela sin foco y el pan conserva selección. No hubo commit.

## Delta: popup de marcador seleccionado

- `ClientMap.tsx` conserva el popup seguro y la selección compartida; MapLibre usa anclaje dinámico, offsets coherentes con el pin, `maxWidth` responsive y `focusAfterOpen:false`. No se añadieron datos fuera de nombre, segmento (`Sin segmento` como fallback) y estado.
- `company-clients.css` sustituye la tarjeta estrecha/centrada por popup golden opaco, compacto y alineado a la izquierda; el nombre admite dos líneas y las puntas cubren anclas dinámicas, incluidas las esquinas.
- `ClientMap.test.tsx` verifica opciones, anclaje no forzado, contenido con nombre largo y DOM seguro. La spec visual exige popup, nombre y estado; se inspeccionó y regeneró únicamente `company-clients-map-selected-win32.png`.

Validación: `npm test -- src/features/company-clients/components/ClientMap.test.tsx` (6/6), `npm run typecheck`, `git diff --check` y `npm run test:visual -- company-clients-map.visual.spec.ts -g "lista extensa, inactivo y selección"` (1/1). Riesgo residual: ninguno conocido; no hubo commit.
