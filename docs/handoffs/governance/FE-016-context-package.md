# FE-016 — Paquete de contexto

**Estado actual:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `b6d8d35 + ac4bee151f2b` (digest reproducible del diff de código consolidado, sin artefactos de handoff).

## Alcance y restricciones

Integrar la generación de propuesta únicamente en `Rutas` para una ruta `DRAFT`. Roles permitidos: `COMPANY_ADMIN` y `SUPERVISOR`; `SELLER` queda fuera. Reutilizar el módulo `company-routes`, sus diálogos, controles de orden y servicios. No crear sidebar, mapa, heurísticas locales ni publicar. Limpiar estado efímero al cierre de sesión o cambio de tenant; no mostrar ni registrar ubicaciones, direcciones, payloads de proveedor ni secretos.

La propuesta admite 1..9 visitas, prioridad como penalización (sin prometer precedencia), restricciones y recomendaciones exclusivamente del Backend. Deben cubrirse carga, vacío, 403, 409, 422, 503, red y sesión expirada.

## Delta Development Frontend — remediación visual/funcional

La propuesta dejó de estar dentro de «Crear/Ordenar borrador»: `COMPANY_ADMIN` y `SUPERVISOR` la abren desde el detalle de una ruta `DRAFT`, en un modal propio. La respuesta exitosa entrega el orden transitorio al editor existente para revisión manual y posterior `PUT` con `proposalVersion`; no publica. Se preserva el cierre por sesión/tenant y no se muestran ni envían ubicaciones, direcciones o payloads del proveedor.

El mapa ya conservaba ubicaciones sólo en memoria; se corrigió el lienzo vacío al recalcular el tamaño de MapLibre tras estabilizar el modal/grid. Sin clave o ubicaciones conserva su estado recuperable y la lista como alternativa.

## Delta Development Frontend — corrección de entrada y mapa

Tras crear una ruta, «Ordenar borrador» expone la acción secundaria accesible «Generar propuesta». Cierra ese editor antes de abrir el modal independiente de propuesta y, al cancelar, restaura el editor sin superponer modales. Se conserva la entrada autorizada desde el detalle `DRAFT`.

La causa del mapa vacío era un viewport sin altura concreta dentro del grid/modal y un único `requestAnimationFrame` que podía ejecutarse antes de que el layout finalizara. El contenedor ahora tiene altura explícita y `ResizeObserver` solicita `map.resize()` ante cada cambio de tamaño. Las rutas sin clave o sin ubicaciones siguen mostrando su estado explícito y la lista alternativa; errores de MapLibre se conservan recuperables.

## Delta Development Frontend — composición de modales

La acción «Generar propuesta» dentro del detalle `DRAFT` ahora cierra el detalle antes de solicitar el modal de propuesta. La prueba verifica el orden `close → proposal`; al estar ambos cambios agrupados por React, no quedan dos `ModalSurface` superpuestos. La entrada desde «Ordenar borrador» y su retorno al cancelar no cambian.

## Delta Development Frontend — mapa, DnD y modal

`RouteOrderEditor` vuelve a integrar `useRouteDirections` y `RouteSequenceMap`, con estados de carga, error, obsolescencia y alternativa de lista ya encapsulados por el mapa. El DnD usa primero `routePointId`, luego `customerId` y sólo como último recurso una clave temporal de la ruta; el `DragOverlay` evita que el elemento activo refluya el modal. El drop calcula origen/destino y mueve el elemento, mientras se preservan las flechas accesibles.

El formulario «Generar propuesta» adopta la composición de modal/formulario de Sellers/Zonas: ancho y scroll acotados, campos de disponibilidad y restricciones en grilla de dos columnas que colapsa a una, tarjetas de visita sin desborde y acciones coherentes en el footer. Se consultaron como referencia los componentes y estilos de Sellers/Zonas; no existe `docs/frontendMockups/FE-016.html`.

**Evidencia:** `RouteOrderEditor.test.tsx`, `RouteProposalDialog.test.tsx` y `RouteSequenceMap.test.tsx`: 13 PASS; `npm run typecheck`, `npm run build` y `git diff --check`: PASS. `npm run lint`: sin errores; warning preexistente ajeno en `company-territories/hooks/useTerritoryForm.test.tsx`.

## Delta Development Frontend — remediación QA DnD

Se eliminó el respaldo DnD basado en `sequence`: `routePointSortableId` devuelve sólo `routePointId` o `customerId`, y `null` sin ambos. Si cualquier punto carece de ID opaco, la lista deshabilita por completo el arrastre, informa la alternativa y conserva flechas, posiciones y etiquetas Inicio/Final. La prueba cubre explícitamente `null`, ausencia de controlador DnD y movimiento por flecha.

**Evidencia:** `npm run typecheck`, `RouteOrderEditor.test.tsx` (5 PASS) y `git diff --check`: PASS.

## Brecha resuelta en Development

**Severidad: alta.** `POST /routes/optimize` devuelve `proposalVersion` y `orderedVisits[].customerId`; `PUT /routes/{routeId}/points/order` sólo acepta `routePointIds` e `If-Match`. Aunque `RoutePoint` expone `customerId`, el reordenamiento no lleva `proposalVersion` ni hay semántica contractual que vincule una edición humana a la propuesta versionada. Por tanto, el portal puede transformar el orden, pero no puede confirmar que el Backend registre la revisión `MANUAL_EDIT` con referencia a la propuesta, como exige EN-018, ni distinguir una propuesta vigente de una regenerada.

**Evidencia:** `docs/api/openapi.yaml` (`OptimizeRouteResponse`, `ReorderRoutePointsRequest`); `docs/architecture/routing/EN-018-route-engine-policy.md`, sección «Versionado y edición»; `frontend/followupbussiness/src/features/company-routes/api.ts` y `types.ts`.

**Criterio impactado:** FE-016.8 (edición persistida con versión/`If-Match`), además de trazabilidad de propuesta y manejo de conflicto.

**Remediación aplicada:** `proposalVersion` es opcional en el flujo aprobado `PUT /routes/{routeId}/points/order`, por compatibilidad con BE-023. Si se informa, Backend autoriza primero ruta/equipo, exige `DRAFT` e `If-Match` vigente, bloquea y valida que sea la última propuesta de la misma ruta, tenant y versión base; después persiste la revisión `MANUAL_EDIT` ligada. Una propuesta regenerada, ajena o desactualizada da `409` sin escritura. La migración `V52` conserva actor, orden y versión resultante. No se creó endpoint de aplicar propuesta ni cambios Frontend.

**Fuente primaria abierta por ambigüedad de persistencia:** `docs/architecture/routing/EN-018-route-engine-policy.md`, «Versionado y edición»; confirmó que la revisión debe conservar origen, actor, instante y referencia a propuesta.

**Evidencia Development:** pruebas focalizadas `ReorderRoutePointsServiceTest,RouteEngineDecisionPolicyTest` y `mvn -q clean verify -Dmaven.repo.local=C:\Users\LUIS\.m2\repository`: PASS. `git diff --check`: PASS.

## Invariantes para la brecha Backend

1. Actor y recurso: tenant y rol desde sesión; supervisor limitado al equipo vigente.
2. Éxito: ruta `DRAFT`, `If-Match` vigente y propuesta de esa ruta producen orden y revisión enlazada.
3. Denegación: propuesta/ruta de otro tenant o fuera de equipo no revela existencia ni escribe.
4. Conflicto: versión base, `If-Match` o propuesta no vigente devuelven `409`, sin sobrescritura.
5. Fallo: toda validación fallida deja sin cambios los puntos, revisión, publicación y eventos.

## Puerta de reanudación

La brecha de persistencia fue resuelta, pero Frontend reportó un bloqueo posterior: el contrato exige `territoryId`, inicio, fin, disponibilidad y restricciones por visita; la ruta consultable sólo aporta `sellerId`, inicio opcional y puntos, sin territorio, fin, jornada, duración ni ventanas. Además, la política de FE-016 prohíbe exponer coordenadas o direcciones en la UI, por lo que no se puede solicitar esos valores como números ni derivarlos localmente.

**Evidencia y criterio:** `OptimizeRouteRequest` en `docs/api/openapi.yaml`; `Route`/`RoutePoint` en el mismo contrato; `frontend/followupbussiness/src/features/company-routes/api.ts` y `types.ts`; handoff `docs/handoffs/frontend/FE-016-development-handoff.md`. Impacta FE-016.4, .6, .8 y .11.

**Decisión MVP aprobada (2026-08-28):** `POST /routes/optimize` sigue centrado en `routeId`. Backend deriva fecha, vendedor y territorio de la ruta y las visitas autorizadas; origen y destino son las ubicaciones del primer y último `Route.Point` persistidos. No usa `route.startLocation` ni retorna al origen. La solicitud conserva sólo `routeId`, `availability`, `baseRouteVersion` y visitas con duración, prioridad y ventanas. La UI no manipula ni presenta coordenadas, direcciones o payloads de proveedor.

Una ruta sin puntos, o con ubicación ausente en el primer/último punto, devuelve `422 ROUTE_ENDPOINT_LOCATION_REQUIRED` estable y recuperable, sin fallback geográfico ni cuota/matriz/persistencia. Los puntos endpoint pueden estar seleccionados como visitas, por lo que los arcos inicial/final pueden valer cero. Todas las visitas deben derivar un único `territoryId` no nulo, activo y asignado al vendedor; más de uno devuelve `422 MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED`, sin IDs. En el futuro, una ubicación server-side del trabajador podrá aportar el origen sin cambiar el contrato de Frontend.

**Remediación aplicada:** el caso de uso carga la ruta con tenant de sesión, deriva fecha/vendedor, limita supervisor al equipo, verifica `DRAFT`, versión y visitas autorizadas; deriva el territorio común y verifica que siga activo/asignado al vendedor. Construye la matriz `primer punto → visitas → último punto`. Si faltan endpoints, responde `422 ROUTE_ENDPOINT_LOCATION_REQUIRED` con `correlationId`, sin consumir cuota, invocar matriz ni persistir. OpenAPI y ADR-014 fueron actualizados.

**Evidencia Development:** `OptimizeRouteServiceTest`, `RouteOptimizationControllerTest`, `RouteEngineDecisionPolicyTest`, `HexagonalArchitectureTest` y `ModuleBoundaryTest`: PASS. `mvn -q clean verify -Dmaven.repo.local=C:\Users\LUIS\.m2\repository`: PASS. `git diff --check`: PASS.

El handoff Backend actualizado permite retomar Frontend con el contrato centrado en ruta y `proposalVersion` con `If-Match`; omitir `proposalVersion` conserva el reordenamiento manual BE-023.

## Delta Development Frontend — usabilidad DnD y propuesta

Durante el arrastre, la tarjeta de origen conserva su espacio pero queda invisible; el `DragOverlay` es la única representación visual. El movimiento sigue calculando origen→destino con IDs opacos y mantiene flechas accesibles.

La propuesta usa `MultiSelect` para elegir hasta 9 visitas candidatas y muestra «X visitas seleccionadas (máximo 9 por propuesta)»; sólo las seleccionadas despliegan tarjetas. Usa `VisualSelect` y el nuevo control compartido `DateTimeField` (calendario + hora), con jornada y ventanas opcionales explicadas semánticamente. La duración se captura en minutos y se convierte a segundos sólo al construir el contrato. Prioridad no tiene máximo local y describe penalización, no orden garantizado. No cambian permisos, contrato, sesión/tenant ni tratamiento de ubicaciones.

**Evidencia:** 14 PASS en `RouteOrderEditor`, `RouteProposalDialog` y `useRouteDraft`; `npm run typecheck`, `npm run build` y `git diff --check`: PASS. `npm run lint`: sin errores; warning preexistente ajeno en `useTerritoryForm.test.tsx`.

## Delta Development Frontend — ajuste visual fecha/hora

`DateFilterField` con `withTime` ahora es un único control visible con una sola etiqueta: el disparador muestra fecha y hora y el popover del calendario contiene el selector de hora y «Aplicar». No hay campo de hora paralelo; los consumidores sólo-fecha no cambian. `RouteProposalControls` conserva primero la selección de visitas y al seleccionar muestra una jerarquía y espaciado alineados con Sellers/Territorios. Mantiene prioridades Baja/Media/Alta con ayuda de penalización clara; la duración usa la métrica visual de `VisualSelect` sin introducir opciones ni reglas.

**Referencia visual:** no existe mockup FE-016; se consultaron los formularios y estilos de Sellers/Territorios. **Evidencia:** 16 PASS focalizados (`DateFilterField`, `RouteProposalDialog`, `useRouteDraft`, `RouteOrderEditor`), `npm run typecheck` y `git diff --check`: PASS.

## Delta Development Frontend — corrección final de calendario y métricas

La hora del calendario es ahora texto controlado `HH:MM` con teclado numérico, normalización y validación; nunca dispara un selector nativo. En `withTime`, pulsar un día conserva el popover y marca la fecha como borrador visual; «Aplicar» sólo se habilita con fecha y hora válidas. Date-only conserva selección y cierre inmediato. Se eliminó la compresión vertical de Jornada de trabajo y la duración se fuerza a 43px totales, `border-box`, ancho, padding, radio y borde equivalentes a `VisualSelect`.

**Evidencia:** 17 PASS focalizados; `npm run typecheck` y `git diff --check`: PASS.

## Delta Development — contrato de ventanas

`windows` es obligatorio en cada visita de `POST /routes/optimize`; `[]` expresa explícitamente ausencia de restricción horaria. El cliente normaliza una visita sin rango a `windows: []`; se conserva la validación Backend que rechaza `windows == null`. No cambian roles, tenant, autorización, persistencia ni componentes visuales.

**Evidencia:** `npm test -- src/features/company-routes/api.test.ts` (9 PASS), `npm run typecheck` (PASS), `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=OptimizeRouteServiceTest test` (PASS) y `git diff --check` (PASS). QA debe revalidar el payload sin ventana y el contrato antes de DoF.

## Delta Development — cobertura de `windows = null`

Se añadió prueba negativa de aplicación: una visita con `windows = null` retorna `Invalid` antes de invocar ruta, alcance, cartera, vendedor, cuota, matriz o persistencia. Es una remediación sólo de prueba; no cambia producción, contrato ni superficie de seguridad.

**Evidencia:** `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=OptimizeRouteServiceTest test` y `git diff --check`: PASS. QA debe revalidar exclusivamente este rechazo sin efectos.

## Delta Development Frontend — marcador único de calendario

Cuando `DateFilterField` con `withTime` tiene una fecha seleccionada, el calendario aplica el tratamiento visual destacado únicamente a esa fecha. El día actual conserva `aria-current="date"`, pero su borde y color teal sólo se muestran cuando no hay selección, evitando la apariencia de doble selección. El borrador, «Aplicar» y el modo sólo-fecha no cambian.

**Evidencia:** `DateFilterField.test.tsx` cubre fecha seleccionada frente a hoy; `npm test -- --run src/shared/ui/DateFilterField.test.tsx` (3 PASS), `npm run typecheck` y `git diff --check`: PASS. Referencia visual: estilos de Sellers/Territorios; no existe mockup FE-016.

## Delta Development Frontend — prioridad y alineación

La ayuda de prioridad ahora declara el comportamiento efectivo: Alta se considera antes que Media y Baja; jornada, ventanas y traslados influyen en el orden final, sin prometer posición exacta. La grilla de duración/prioridad alinea contenido y controles al inicio, evitando que la ayuda de prioridad centre verticalmente la duración.

**Evidencia:** 17 PASS focalizados; `npm run typecheck` y `git diff --check`: PASS.

## Delta Development Backend — 422 seguro y trazable

La validación de disponibilidad devuelve `422 application/problem+json` con detalle genérico, `correlationId` y código público estable. Si `availability.start >= availability.end`, el código es `AVAILABILITY_END_MUST_BE_AFTER_START`; una ventana de visita inválida usa `VISIT_WINDOW_END_MUST_BE_AFTER_START`. Los demás rechazos sólo exponen `INVALID_OPTIMIZE_REQUEST` o el código ya documentado `ROUTE_ENDPOINT_LOCATION_REQUIRED`.

El controlador normaliza cualquier mensaje de excepción fuera de esa lista, por lo que no devuelve nombres de clases, trazas ni datos internos. El servidor registra la excepción completa asociada a `correlationId`, sin registrar el cuerpo de solicitud. OpenAPI documenta los códigos del 422 de optimización.

**Evidencia:** `OptimizeRouteServiceTest`, `RouteOptimizationControllerTest` y `RouteEngineDecisionPolicyTest`: PASS; `git diff --check`: PASS.

## Delta Development Frontend — horas y selección de visitas

La fecha de la ruta es inmutable en la propuesta: Jornada y ventanas capturan únicamente `HH:MM` mediante `TimeField` compartido, sin calendario ni `datetime-local`. Antes del POST, el hook combina cada hora con `route.date` en hora local y serializa ISO. Inicio y fin de jornada deben ser estrictamente crecientes; una ventana parcial o invertida muestra error junto al campo y bloquea la solicitud. `MultiSelect.closeOnSelect` es opcional, conserva los demás usos y en visitas cierra el menú tras cada marca para poder continuar el formulario; se puede reabrir para seleccionar otra.

**Evidencia:** 13 PASS (`TimeField`, `MultiSelect`, `RouteProposalDialog`, `useRouteDraft`), `npm run typecheck`, `npm run build` y `git diff --check`: PASS. `npm run lint`: 0 errores y warning preexistente en `useTerritoryForm.test.tsx`. Referencia visual: Sellers/Territorios; no existe mockup FE-016.

## Delta Security remediation — correlación de optimización

`POST /routes/optimize` acepta para trazabilidad únicamente un UUID v4 canónico de 36 caracteres; otro valor se reemplaza por un UUID v4 generado por servidor antes de responder o registrar. Las validaciones registran sólo el código público permitido y la correlación; no registran excepción, traza ni solicitud. Las pruebas cubren un encabezado CR/LF con secreto y un mensaje interno de `Invalid`, ausentes tanto de respuesta como de evento de log.

## Delta Development Frontend — extremos sin ubicación

El cliente preserva sólo el código público `ROUTE_ENDPOINT_LOCATION_REQUIRED` al normalizar el problema 422. `RouteProposalDialog` presenta el mensaje seguro «La ruta necesita ubicación en su primer y último cliente para generar la propuesta.» y, si existe, su `correlationId` como identificador de seguimiento. No expone coordenadas, direcciones ni detalle del servidor.

**Evidencia:** `src/lib/api.test.ts` y `RouteProposalDialog.test.tsx`: 19 PASS; `npm run typecheck` y `git diff --check`: PASS.

**Candidate-ID:** consolidado en el valor superior para QA/DoF.

## Delta remediación QA Backend — endpoints MVP

`RouteEngineDecisionPolicyTest` exige que ADR-014 declare primer/último
`Route.Point` y `ROUTE_ENDPOINT_LOCATION_REQUIRED`, y prohíbe las referencias
obsoletas. `OptimizeRouteServiceTest` cubre ubicación nula en ambos extremos
mediante lectura persistente simulada, sin vendedor, cartera, cuota, matriz ni
propuesta; también cubre matriz asimétrica con ambos endpoints como visitas,
arcos cero y métricas resultantes.

**Evidencia:** `OptimizeRouteServiceTest`, `RouteOptimizationControllerTest`,
`RouteEngineDecisionPolicyTest`, `HexagonalArchitectureTest` y
`ModuleBoundaryTest`: PASS; `git diff --check`: PASS.

## Delta Development Backend — territorio derivado

`OptimizeRouteRequest` ya no acepta `territoryId`. Tras autorizar tenant, ruta y
cartera, Backend obtiene las visitas por vendedor/fecha, exige un único territorio
no nulo y verifica que siga activo/asignado. La propuesta persiste ese territorio.
Visitas de más de un territorio devuelven `422 MULTIPLE_VISIT_TERRITORIES_NOT_SUPPORTED`
antes de cuota, matriz o persistencia; las visitas fuera de tenant/cartera siguen
en `403` sin revelar IDs. Se actualizaron OpenAPI y ADR-014.

**Evidencia:** `OptimizeRouteServiceTest`, `RouteOptimizationControllerTest`,
`RouteEngineDecisionPolicyTest`, `JdbcMatrixQuotaIntegrationTest`,
`HexagonalArchitectureTest` y `ModuleBoundaryTest`: PASS; `git diff --check`:
PASS. `clean verify` queda para una ventana sin procesos que retengan `target`.

## Delta Development — elegibilidad territorial y matriz

Una visita cuyo territorio no está asignado al vendedor devuelve `422 VISIT_TERRITORY_NOT_ASSIGNED_TO_SELLER`; `403` queda para actor, ruta o cartera no autorizados. La cartera de creación y las sugerencias excluyen territorios fuera de las asignaciones activas del vendedor antes de paginar y la UI conserva una defensa en memoria.

El stub de `TravelMatrix` fue reemplazado por un adaptador Mapbox Matrix detrás del puerto neutral, limitado a 2..11 nodos. Usa sólo token server-side (`MAPBOX_MATRIX_TOKEN` o `FOLLOW_UP_BUSSINESS_MAPBOX_MATRIX`); ausencia, autorización, timeout y respuesta inválida se devuelven como `503` seguros. Temporalmente el log registra sólo razón pública y `correlationId` para 403/503.

**Evidencia Development:** pruebas focalizadas Backend (45) y Frontend (46), typecheck y `git diff --check`: PASS. El spike vivo Mapbox sigue opt-in; QA debe validar contrato, filtros, 422/403 y fallos 503 sin token ni datos sensibles.
