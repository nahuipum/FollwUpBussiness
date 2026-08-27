# FE-015 — Development handoff

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `9e030b7 + FE-014 rutas-ui + FE-015 draft-create-order + cartera-degrada-sugerencias + idem-ambigua + idem-payload + ui-homologada + route-create-max-50 + max-50-cartera-retry + max-selector + app-401-wait + fecha-programada-copy + footer-gap + route-customer-names-batch + sequence-map-dnd + supervisor-routes + directions-vial + directions-session-isolation` (working tree, sin commit).

## Entregado

- `company-routes` permite a COMPANY_ADMIN y SUPERVISOR crear un borrador con fecha, vendedor y 1..50 clientes; SELLER no recibe acción ni formulario.
- Transporte: `POST /routes` con `Idempotency-Key`, cartera paginada (`/customers?sellerId`) y sugerencias adicionales paginadas. Solo se conservan ID/nombre autorizados; no se muestran ni guardan datos personales, direcciones o coordenadas.
- Tras `201`, el diálogo permite ordenar mediante botones accesibles y teclado, anuncio `aria-live`, `If-Match` y recarga explícita ante `409`. `routePointId` es opaco, sólo memoria interna y nunca se renderiza/persiste.
- Cambio de sesión/tenant cierra y limpia formulario, opciones, selección, borrador, filtros y detalle. No hay llamada de publicación.

## Evidencia

- Pruebas focalizadas: `npm test -- --run src/features/company-routes` — 5 archivos, 11 pruebas aprobadas.
- `npm run typecheck`, `npm run build` y `git diff --check` aprobados. Build conserva aviso no bloqueante de tamaño de chunk.
- `npm run lint` sin errores; persiste un warning ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.
- Suite completa: 55/56 archivos y 273/274 pruebas; falla ajena en `src/app/PasswordRecoveryScreen.test.tsx` al esperar el foco del botón de cerrar tras Tab.

## QA / Security

- Verificar idempotencia/doble clic, 403, y 409: el orden debe refrescarse sin sobrescribir; ningún ID opaco ni dato privado puede aparecer en DOM.
- Reproducir logout/cambio de tenant con diálogo abierto: selección, sugerencias, borrador y detalle deben desaparecer.
- Mockup consultado: no existe `FE-015`; se reutilizó `company-routes` FE-014.

## Delta tras QA

- La falla de sugerencias ya no vacía ni bloquea la cartera autorizada: se conserva la selección, se muestra feedback no bloqueante y `Reintentar sugerencias`. Si falla cartera, permanece el error de carga.
- Revalidación: `npm test -- --run src/features/company-routes` — 6 archivos, 13 pruebas aprobadas; `npm run typecheck` y `git diff --check` aprobados.

## Delta tras Security

- `Idempotency-Key` se conserva en memoria por intento lógico tras pérdida de red o respuesta ambigua (`5xx`) y se reutiliza en el reintento; se rota al éxito, rechazo no ambiguo, cambio del formulario o cierre/sesión.
- Revalidación: `npm test -- --run src/features/company-routes` — 6 archivos, 14 pruebas aprobadas; `npm run typecheck` y `git diff --check` aprobados.

## Delta tras QA de idempotencia

- Cualquier modificación del payload local, incluida la selección de clientes, invalida la clave retenida; sólo el reintento del mismo payload ambiguo la reutiliza.
- Revalidación focal: 6 archivos, 14 pruebas aprobadas; typecheck y diff-check aprobados.

## Delta de homologación UI

- La acción de creación sigue el patrón de Vendedores/Zonas (`Plus` y botón primario); el formulario reutiliza `DateFilterField`, `ModalAsyncState` y `FormAlert` compartidos.
- Se estabilizó `PasswordRecoveryScreen.test.tsx` conforme al orden real del foco del diálogo.
- Validación completa: `npm test` 57 archivos / 277 pruebas aprobadas; lint sin errores (un warning ajeno en `useTerritoryForm.test.tsx`), typecheck, build y diff-check aprobados.

## Delta de límite y cartera

- Límite local de clientes alineado a ADR-023: 1..50. El selector indica `Selecciona clientes` y `x de 50`.
- Tras seleccionar fecha y vendedor carga cartera/sugerencias; la falla de cartera muestra estado claro con `Reintentar cartera`, mientras la falla de sugerencias no bloquea la cartera.
- Encabezado y acción primaria de Rutas ahora comparten reglas de alineación, espaciado, tamaño, padding, borde y radio con Vendedores.
- Revalidación: 6 archivos / 15 pruebas focalizadas, typecheck, lint sin errores (warning ajeno), build y diff-check aprobados.

## Delta tras QA-015-01

- Al llegar a 50, las opciones aún no seleccionadas se deshabilitan; las seleccionadas siguen disponibles para desmarcar. El aviso accesible explica cómo sustituir una selección.
- Prueba negativa añadida; revalidación focal: 6 archivos / 16 pruebas, typecheck y diff-check aprobados.

## Validación CI-equivalente final

- `npm test`: 56/57 archivos y 278/279 pruebas aprobadas; falla ajena en `src/app/App.test.tsx` (`clears one active session...`): después de 401 conserva `/seller/dashboard` en lugar de `/`.
- `npm run lint`: sin errores; persiste un warning ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.
- `npm run typecheck`, `npm run build` y `git diff --check`: aprobados. Build mantiene aviso no bloqueante de tamaño de chunk.

## Delta de CI

- `App.test.tsx` espera de forma asíncrona la redirección tras el diálogo 401; no cambia producción.
- CI-equivalente final: `npm test` 57 archivos / 279 pruebas aprobadas; lint sin errores (warning ajeno), typecheck, build y diff-check aprobados.

## Delta UX de fecha

- El selector ahora se titula `Fecha programada de la ruta` y explica que corresponde al día de visitas del vendedor; no cambia valor, contrato ni flujo.
- Revalidación focal: 6 archivos / 16 pruebas, typecheck y diff-check aprobados.

## Delta visual de footer

- El pie de los modales de crear y ordenar Rutas incorpora la misma separación horizontal de `12px` entre acciones que Vendedores y Zonas; se conserva el apilado responsive existente.
- Revalidación focal: `RouteDraftDialog.test.tsx` — 5 pruebas aprobadas; `npm run typecheck` y `git diff --check` aprobados.

## Delta de secuencia planificada

- El diálogo de orden usa el patrón MapLibre existente para mostrar marcadores numerados y línea de **secuencia planificada**; declara explícitamente que no es navegación por calles. Sin mosaicos, ubicación o carga de mapa, conserva lista/orden y ofrece reintento cuando corresponde.
- El arrastre nativo de puntero es la acción principal; `Subir`/`Bajar`, anuncio `aria-live`, `PUT`/`If-Match` y manejo de conflicto se mantienen como alternativa accesible y persistencia.
- `customerName` y ubicación se aceptan de forma degradable. La ubicación es efímera para el mapa: no se renderiza como texto, registra ni persiste; los IDs opacos conservan la misma restricción.
- Revalidación: `npm test -- --run src/features/company-routes` — 7 archivos / 20 pruebas aprobadas; `npm run typecheck`, `npm run build` y `git diff --check` aprobados. Build conserva aviso no bloqueante de tamaño de chunk.

## Delta de acceso supervisor y conflicto

- `App` monta `CompanyRoutesPage` bajo `/supervisor/routes` con el workspace y sección de SUPERVISOR; la ruta administrativa y los demás roles permanecen sin cambios.
- Ante `409` al guardar orden, se recupera la versión remota y se marca conflicto sin sobrescribir la secuencia actual del servidor.
- Revalidación focal: `App.test.tsx` y `useRouteDraft.test.tsx` — 42 pruebas aprobadas; `npm run typecheck` y `git diff --check` aprobados.

## Validación CI-equivalente del candidato combinado

- `npm test`: 58 archivos / 284 pruebas aprobadas.
- `npm run lint`: sin errores; conserva un warning ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.
- `npm run typecheck`, `npm run build` y `git diff --check`: aprobados. Build conserva aviso no bloqueante de tamaño de chunk.

## Delta Directions vial

- `GET /routes/{routeId}/directions` se consulta con autorización de sesión al abrir el editor. La respuesta se valida contra el contrato neutral y permanece sólo en memoria; no se registran, persisten ni presentan coordenadas, tokens o IDs opacos.
- `RouteSequenceMap` prioriza la geometría vial para el orden guardado. Al reordenar localmente invalida el trazo vial y comunica la secuencia aproximada; al guardar y cambiar versión vuelve a solicitar Directions. `403`, datos vacíos y errores (incluido `503 DIRECTIONS_UNAVAILABLE`) conservan lista/DnD, etiquetan el respaldo como aproximado/no navegación y habilitan reintento.
- Pruebas añadidas: payload neutral/codificación de ruta, geometría vial en MapLibre, fallback 503 y ciclo cargar–invalidar–refrescar por versión.

## Verificación Directions

- `npm test -- --run src/features/company-routes` — 8 archivos, 26 pruebas aprobadas.
- `npm run typecheck`, `npm run build` y `git diff --check` — aprobados. Lint sin errores; persiste sólo el warning ajeno de `company-territories/hooks/useTerritoryForm.test.tsx`. Build conserva el aviso no bloqueante de tamaño de chunk.

Riesgo residual: sin `MAPBOX_DIRECTIONS_TOKEN` server-side el backend devuelve `503`; la UI muestra el fallback esperado y no necesita ni expone dicho token.

## Delta de revalidación final

**Candidate-ID:** `9e030b7 + rutas-ui-directions + dnd-kit-sortable + espaciado-visitas + botones-modal-homologados + dnd-opaque-id-remediated` (working tree).

- El reordenamiento usa `dnd-kit` con controlador dedicado y animación de los ítems vecinos; flechas y anuncio accesible permanecen disponibles. La selección de texto se bloquea sólo durante el arrastre.
- Las listas de visitas de ordenar y visualizar usan el mismo espaciado; los botones de pie de modal igualan los tokens de Vendedores/Zonas.
- Frontend: `npm run lint`, `npm run typecheck`, `npm run build` y pruebas focales de Rutas (9) aprobaron. El build conserva sólo el aviso de chunks mayores a 500 kB.
- Backend: las pruebas focales de ruta/configuración aprobaron; `AuditEntryMigrationTest` no pudo iniciar Testcontainers porque no hay Docker disponible. `clean verify` tampoco pudo limpiar `target`, retenido por el servicio local del usuario; no se detuvo ni alteró dicho servicio.

## Remediación de seguridad

- `routePointId` no llega a `dnd-kit`: se traduce en memoria a `route-sort-N`. La prueba activa el controlador por teclado y verifica que el ID opaco no aparece en DOM.
- `npm run typecheck`, `RouteOrderEditor.test.tsx` (3) y `git diff --check` aprobaron.

## Delta de aislamiento de sesión Directions

- `useRouteDirections` asigna una generación local a cada lectura y la invalida al logout/cambio de tenant. Una respuesta anterior sólo puede actualizar el estado si su generación sigue vigente; se descartan también sus estados de error y carga.
- Reproducción cubierta: abrir el editor, dejar `GET /directions` pendiente, cambiar sesión/tenant y resolver el `200` anterior; la geometría permanece vacía y la carga termina.
- Revalidación focal: `npm test -- --run src/features/company-routes/hooks/useRouteDirections.test.ts` — 2 pruebas aprobadas; `npm run typecheck` y `git diff --check` aprobados.
