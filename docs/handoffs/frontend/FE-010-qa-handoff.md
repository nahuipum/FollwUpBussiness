# FE-010 — Handoff QA Frontend

**Estado:** PASS  
**Candidate-ID:** `HEAD 574be0e + FE010_SCOPE_SHA256 b9160c0d43a5d72ccf1bbd30db2044b3af6d050e70d63a58014a34b66eeac87b + FE010_POPUP_SHA256 8233870fc653c64cf8a3fdfde4ffab01fa33e12519e3aaa8bcd1f3627d911f89 (5 archivos)`.

## Mapeo y evidencia

- Popup seleccionado → `ClientMap.tsx` y `company-clients.css` → MapLibre resuelve el anclaje sin `anchor` forzado; offsets para cardinales/esquinas, `maxWidth` dependiente del viewport, superficie opaca, contenido alineado, nombre a dos líneas y punta por ancla. Baseline `company-clients-map-selected-win32.png` inspeccionada: popup legible, punta inferior, pin y fila seleccionados.
- Accesibilidad y seguridad → `ClientMap.tsx`/`ClientMap.test.tsx` → `focusAfterOpen:false` no desplaza foco; popup usa `textContent` y `setDOMContent`, y restringe nombre, segmento (`Sin segmento`) y estado. La unitaria prueba texto malicioso sin nodo `img`, roles/`aria-pressed`, activo/inactivo y cleanup.
- Selección, zoom y marcadores → `company-clients-map.visual.spec.ts` → prueba visual verifica lista↔mapa, popup estable, marcador seleccionado y anclaje `absolute`/`translate(...)` de MapLibre antes y después de zoom.
- Permisos, sesión/cache, formularios y WebSocket → no modificados por este delta; el popup no consume ni persiste identidad/tenant adicional. No se detectó regresión directa.

## Comandos QA

`npm test -- src/features/company-clients/components/ClientMap.test.tsx` — 6/6 correctas.  
`npm run test:visual -- company-clients-map.visual.spec.ts -g "lista extensa, inactivo y selección|los marcadores conservan el anclaje geográfico"` — 2/2 correctas.

`git diff --check` sin errores. Se recalculó la firma de los cinco archivos: coincide con `FE010_POPUP_SHA256` declarado. Sin hallazgos ni regresión directa. Riesgo residual: anclaje final depende de la heurística propia de MapLibre, cubierto aquí para zoom, anclas dinámicas y viewport visual seleccionado. No se modificó producción.
