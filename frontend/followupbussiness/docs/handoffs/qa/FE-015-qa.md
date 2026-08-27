# FE-015 — QA independiente

**Estado:** `PASS`  
**Candidate-ID:** `9e030b7 + rutas-ui-directions + dnd-kit-sortable + espaciado-visitas + botones-modal-homologados + dnd-opaque-id-remediated` (working tree).

## Trazabilidad de revalidación

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| Máximo de 50 | Al llegar a 50, las opciones no seleccionadas reciben `disabled`; el envío conserva su guardia 1..50. | `RouteDraftDialog.test.tsx`: opción 51 deshabilitada. |
| Feedback accesible | El estado de límite se anuncia mediante `role=status` y explica cómo elegir otro cliente. | Misma prueba focalizada comprueba el mensaje. |
| Sustitución | Las opciones ya seleccionadas no se deshabilitan; `MultiSelect` conserva su cambio para desmarcarlas. | Inspección directa: checkbox de `Cliente 0` habilitado y `toggle` elimina su ID. |
| Fecha programada | La etiqueta explica el día de visitas; `DateFilterField` la asocia al botón con `aria-labelledby` y nombra el calendario. | Copia y asociación inspeccionadas; prueba del diálogo aprobada. |
| Footer | `.route-detail footer` aplica `gap: 12px` tanto al formulario de creación como al de orden; el responsive conserva `column-reverse` y ancho completo. | Inspección CSS y contraste con footers de Vendedores/Zonas. |

## Resultado

QA-015-01 resuelto. Con 50 clientes, el cliente 51 no es seleccionable; los 50 existentes siguen disponibles para desmarcar y el feedback es accesible. No se modificaron permisos, carga/reintento de cartera, sugerencias ni publicación.

## Validación

- `npm test -- --run src/features/company-routes/components/RouteDraftDialog.test.tsx`: 1 archivo, 5 pruebas aprobadas.
- `npm test -- --run src/app/App.test.tsx`: 1 archivo, 38 pruebas aprobadas; la aserción 401 espera la redirección asíncrona.
- Revalidación UX: `npm test -- --run src/features/company-routes/components/RouteDraftDialog.test.tsx`: 1 archivo, 5 pruebas aprobadas.
- Revalidación visual focal: mismo comando, 1 archivo y 5 pruebas aprobadas.
- `git diff --check`: aprobado.

Delta visual: no cambia contrato, lógica ni permisos. Riesgo residual: ninguno nuevo; regresión directa del selector, fecha, footers y flujo 401 cubierta.

## Delta QA — Directions vial

`PASS`: Directions se consulta autenticado desde el endpoint interno, MapLibre prioriza geometría vial y `503`/`403` conservan lista y DnD con respaldo inequívoco de secuencia aproximada. Una respuesta Directions pendiente se invalida en logout/cambio de tenant; el `200` anterior no actualiza geometría, error ni carga. `npm test -- --run src/features/company-routes/hooks/useRouteDirections.test.ts` (2 PASS) y `git diff --check` — PASS; sin llamadas live ni secretos.

## Revalidación final

**Estado:** `PASS`. OpenAPI y paquete declaran `POST /directions/preview` efímero para actualizar el trazo vial del orden local antes de guardar. Tras el cierre de seguridad, el DnD conserva puntero, teclado y flechas; `routePointId` se traduce a IDs efímeros y la prueba de teclado no lo encuentra en DOM. `RouteOrderEditor.test.tsx`: 3 PASS.
