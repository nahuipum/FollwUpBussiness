# FE-010 — Informe final de Seguridad

**Estado:** PASS  
**Candidate-ID:** `HEAD 574be0e + FE010_SCOPE_SHA256 b9160c0d43a5d72ccf1bbd30db2044b3af6d050e70d63a58014a34b66eeac87b + FE010_POPUP_SHA256 8233870fc653c64cf8a3fdfde4ffab01fa33e12519e3aaa8bcd1f3627d911f89 (5 archivos)`

## Superficie revisada

Delta sensible del popup de cliente seleccionado en `ClientMap.tsx` y su prueba: DOM frente a entrada no confiable, minimización de datos de cliente/ubicación y ausencia de ampliación de autorización o filtrado. Se reutilizaron los handoffs Dev y QA del mismo candidato.

## Resultado y evidencia

- **PASS — Inyección DOM:** `popupContent` crea nodos explícitos, asigna `client.name`, `client.segment` y estado mediante `textContent`, y MapLibre recibe el árbol con `setDOMContent`; no usa `innerHTML`.
- **PASS — Minimización:** el popup solo incorpora nombre, segmento (`Sin segmento` como fallback) y estado. Las coordenadas solo posicionan marcador/popup; no se insertan en el DOM. No se añaden contacto, dirección, IDs, `tenantId`, empresa, supervisor, vendedor ni roles.
- **PASS — Alcance:** el delta visual opera sobre el arreglo `clients` ya entregado al componente y no modifica obtención de datos, filtros, rutas, roles, sesión ni cache; no amplía autorización ni aislamiento tenant.

**Hallazgos:** ninguno.

## Abuso reproducido

Payload de segmento `Mayorista <img src=x>`: queda como texto literal y no crea nodo `img`. `npm test -- src/features/company-clients/components/ClientMap.test.tsx -t "popup seguro"` — 1/1 PASS (5 omitidas por filtro).

## Controles no aplicables y riesgo residual

Secretos/dependencias, almacenamiento local, WebSocket, Redis/cache, mensajería, archivos e infraestructura: no modificados. Riesgo residual: la confidencialidad del popup depende del conjunto autorizado suministrado por la capa superior; este candidato no altera ese control y QA confirmó el mismo Candidate-ID.
