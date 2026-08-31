# FE-016 — Handoff Development Frontend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `b6d8d35 + ac4bee151f2b`

## Entrega

La propuesta se separó de «Crear/Ordenar borrador». En el detalle de una ruta `DRAFT`, los roles `COMPANY_ADMIN` y `SUPERVISOR` pueden abrir el modal propio «Generar propuesta». Tras un `POST /routes/optimize` exitoso, el orden propuesto se entrega al editor existente para revisión manual y `PUT /points/order` con `proposalVersion`; no se publica nada.

Al usar esa acción desde el detalle, éste se cierra antes de abrir la propuesta; no se superponen `ModalSurface`. Desde «Ordenar borrador» se conserva el flujo separado y el retorno al editor al cancelar.

Después de crear un borrador, el footer de «Ordenar borrador» también ofrece «Generar propuesta» como acción secundaria. Cierra el editor para abrir el modal propio y, si se cancela, restaura el editor; no hay modales superpuestos. La acción del detalle `DRAFT` se conserva.

`RouteProposalDialog` reutiliza `ModalSurface`, `ModalHeader`, `FormAlert`, controles y footer compartidos. Cubre carga, 403, 409, 422, 503 y red; conserva limpieza por sesión/empresa. Los IDs opacos y ubicación permanecen sólo en memoria; no se muestran, registran ni entran al cuerpo de optimización.

Se corrigió la causa del lienzo de mapa vacío: el contenedor modal/grid no tenía una altura concreta y el único `requestAnimationFrame` podía ocurrir antes del layout final. Ahora el viewport tiene altura explícita y `ResizeObserver` llama a `map.resize()` cuando cambia. Mantiene los estados explícitos y recuperables por clave o ubicaciones ausentes y la lista como alternativa accesible.

La remediación reincorpora ese mapa al editor de orden usando `useRouteDirections` y `RouteSequenceMap`. DnD identifica puntos por sus IDs opacos (`routePointId`, con `customerId` como respaldo), mueve el origen al destino y usa `DragOverlay` para que el arrastre no desborde ni desplace el modal; las flechas accesibles siguen disponibles. El formulario de propuesta ahora usa estructura `form` y footer estándar, scroll/anchura acotados y grillas responsivas para disponibilidad y restricciones.

Tras QA se eliminó cualquier respaldo DnD basado en `sequence`. Si un punto no contiene `routePointId` ni `customerId`, se deshabilita el arrastre de esa lista, se comunica la alternativa y se conservan las flechas y etiquetas de posición; no se genera una identidad DnD derivada de la secuencia.

## Archivos y evidencia

- `RouteOrderEditor.tsx`, `route-ordering.ts`, `RouteProposalDialog.tsx`, `RouteProposalControls.tsx`, `company-routes.css` y pruebas focalizadas.
- `npm run typecheck`: PASS.
- Pruebas focalizadas de remediación: 13 PASS (`RouteOrderEditor`, `RouteProposalDialog`, `RouteSequenceMap`); cubren mapa, IDs/movimiento DnD y composición semántica/responsiva.
- `npm run lint`: sin errores; warning ajeno en `useTerritoryForm.test.tsx`.
- `npm run build`: PASS; aviso preexistente de chunks >500 kB.
- `git diff --check`: PASS.
- Remediación QA: `npm run typecheck` y `RouteOrderEditor.test.tsx` (5 PASS): PASS.

Reproducción: abrir «Ordenar borrador» con puntos que tengan IDs opacos: el mapa y la lista aparecen juntos y el arrastre mueve una visita sin reflujo. Si alguno no tiene `routePointId` ni `customerId`, no aparece el controlador de arrastre, se anuncia el uso de flechas y éstas siguen moviendo por posición. Abrir «Generar propuesta», reducir la ventana y comprobar que disponibilidad y restricciones se apilan sin corte horizontal.

## Remediación de usabilidad

El origen DnD queda `visibility: hidden` mientras se muestra un solo `DragOverlay`; mantiene su hueco y el drop sigue moviendo origen→destino. El modal usa `MultiSelect` para limitar en UI a 9 visitas y sólo configura las elegidas, por lo que una ruta de 20/30 puntos no multiplica los formularios. `DateTimeField` amplía el calendario compartido con hora, sustituye todos los `datetime-local` locales y respeta el bloqueo al guardar.

Las etiquetas explican Jornada de trabajo, ventana opcional, duración estimada en minutos y prioridad como penalización sin promesa de orden; la conversión a `serviceDurationSeconds` ocurre sólo al enviar. No hay máximos nuevos para prioridad ni exposición de IDs, coordenadas, direcciones o datos de proveedor.

**Archivos:** `RouteProposalDialog`, `RouteProposalControls`, `useRouteDraft`, DnD/estilos/pruebas de `company-routes` y `shared/ui/DateFilterField.tsx`.

**Validación:** 14 PASS focalizados (`RouteOrderEditor`, `RouteProposalDialog`, `useRouteDraft`); `npm run typecheck`, `npm run build`, `git diff --check`: PASS. `npm run lint`: 0 errores y un warning preexistente ajeno en `useTerritoryForm.test.tsx`; build conserva aviso preexistente de chunks >500 kB.

**Riesgo/reproducción:** abrir propuesta de una ruta con más de 9 puntos, seleccionar nueve y comprobar que el décimo queda deshabilitado y no tiene tarjeta. Ingresar 30 minutos y generar: el cuerpo de optimización contiene `serviceDurationSeconds: 1800`. Arrastrar una visita: se ve sólo el overlay y soltarla sobre otra mueve el origen a ese destino.

## Ajuste visual final

`DateFilterField withTime` muestra un único disparador bajo la etiqueta del campo. Al abrirlo, fecha y hora se eligen dentro del popover; «Aplicar» confirma el valor y no existe input de hora fuera de él. Los flujos sólo-fecha se preservan.

`RouteProposalControls` mantiene selección inicial de 0 visitas, `MultiSelect` y posterior configuración, con jerarquía, tipografía y separación homólogas a Sellers/Territorios. Prioridad conserva Baja/Media/Alta y explica la penalización. La duración estimada conserva minutos y usa el alto, ancho y borde de `VisualSelect`; la conversión a segundos sigue en el hook.

**Archivos:** `shared/ui/DateFilterField.tsx`, `shared/ui/date-filter-field.css`, `shared/ui/DateFilterField.test.tsx`, `company-routes/components/RouteProposalControls.tsx`, estilos y pruebas de propuesta.

**Validación:** 16 PASS focalizados; `npm run typecheck` y `git diff --check`: PASS. Referencia visual consultada: formularios/estilos de Sellers y Territorios; no hay mockup FE-016.

**Reproducción:** abre «Generar propuesta», selecciona una visita, abre «Inicio de jornada» y comprueba que «Hora» sólo aparece en el popover; cambia a 09:30 y pulsa «Aplicar». Confirma que la duración y `VisualSelect` tienen la misma métrica visual y que no hay controles de configuración antes de elegir visitas.

## Corrección visual de cierre

La hora es `input type="text"` controlado `HH:MM`, con `inputMode="numeric"`, normalización y validación; no hay UI nativa de hora. Con `withTime`, elegir día conserva y marca la fecha borrador en el calendario; «Aplicar» exige fecha y hora válidas. El modo sólo-fecha conserva su aplicación y cierre inmediato.

Se reemplazaron márgenes negativos de «Jornada de trabajo» por grilla y separación vertical consistente. La duración tiene exactamente 43px totales en `border-box`, ancho completo, padding de 12px, radio 10px y borde de `VisualSelect`, sin reglas que la engrandezcan.

**Validación:** 17 PASS focalizados (`DateFilterField`, `RouteProposalDialog`, `useRouteDraft`, `RouteOrderEditor`), `npm run typecheck` y `git diff --check`: PASS.

## Prioridad y alineación final

La ayuda ahora comunica: «Alta se considera antes que Media y Baja». Aclara que jornada, ventanas y traslados influyen en el orden final y no promete posición exacta; no menciona penalización ni omisión. La grilla aplica `align-items` y `align-content` al inicio para que duración y prioridad, incluidos sus controles de 43px, comiencen en la misma línea.

**Validación:** 17 PASS focalizados, `npm run typecheck` y `git diff --check`: PASS.

## Corrección de marcador de fecha

En el calendario de `DateFilterField` con hora, una fecha seleccionada es la única con el resaltado teal de selección. «Hoy» mantiene `aria-current="date"`, sin borde ni color competidor mientras exista selección; sin fecha elegida conserva su marcador sutil. No cambian borrador, «Aplicar», accesibilidad de teclado ni modo sólo-fecha.

**Archivos:** `shared/ui/DateFilterField.tsx`, `date-filter-field.css`, `DateFilterField.test.tsx`.

**Validación:** `npm test -- --run src/shared/ui/DateFilterField.test.tsx` (3 PASS), `npm run typecheck` y `git diff --check`: PASS.

**Riesgo/reproducción:** abre «Inicio de jornada» con `30/08/2026 · 09:30` mientras hoy es 27: el 30 queda teal y el 27 conserva semántica de hoy sin borde/color teal. Sin fecha escogida, hoy puede mostrar su marcador sutil.

## Corrección de ventanas opcionales

Cada visita envía siempre `windows`: cuando no se define una ventana, transmite `[]`; `null` sigue inválido. El contrato OpenAPI exige el arreglo y permite que esté vacío, coherente con Backend, que interpreta vacío como ausencia de restricción. Se añadió cobertura negativa para garantizar que `windows = null` se rechace antes de ruta, alcance, cartera, vendedor, cuota, matriz o persistencia.

**Validación:** `api.test.ts` (9 PASS), `npm run typecheck`, `OptimizeRouteServiceTest` y `git diff --check`: PASS.

## Corrección de horas y multiselección

La propuesta captura sólo horas `HH:MM` para jornada y ventanas mediante `shared/ui/TimeField`; no presenta calendario ni permite cambiar el día. `useRouteDraft` deriva todos los ISO de `route.date` en hora local. Antes de `POST /routes/optimize`, bloquea y muestra el error de campo si jornada inicio ≥ fin, si una ventana está incompleta o si inicio ≥ fin; no realiza request.

`MultiSelect` incorpora `closeOnSelect` opcional y se activa sólo en visitas: cierra tras cada selección, devuelve foco al disparador y puede reabrirse. El resto de consumidores conserva el comportamiento anterior.

**Archivos:** `shared/ui/TimeField.tsx`, `time-field.css`, `MultiSelect.tsx` y pruebas; `RouteProposalControls/Dialog`, `useRouteDraft`, tipos, página y estilos de `company-routes`.

**Validación:** `npm test -- --run src/shared/ui/TimeField.test.tsx src/shared/ui/MultiSelect.test.tsx src/features/company-routes/components/RouteProposalDialog.test.tsx src/features/company-routes/hooks/useRouteDraft.test.tsx` (13 PASS); `npm run typecheck`, `npm run build` y `git diff --check`: PASS. `npm run lint`: 0 errores; warning preexistente ajeno en `useTerritoryForm.test.tsx`. Build mantiene aviso preexistente de chunks >500 kB.

**Reproducción:** abrir propuesta, seleccionar una visita y confirmar que el menú se cierra/reabre. Ingresar jornada `08:00–08:00` o ventana `12:00–09:00`: aparece el error de campo y no se llama a optimización. Con `08:00–17:00`, el cuerpo usa el día de `route.date` para ambos ISO.

## Delta — ubicación de extremos requerida

El normalizador conserva exclusivamente el código público `ROUTE_ENDPOINT_LOCATION_REQUIRED`. El modal de propuesta muestra: «La ruta necesita ubicación en su primer y último cliente para generar la propuesta.» No renderiza coordenadas, direcciones ni detalles del problema. Si llega `correlationId` válido, queda visible como identificador de seguimiento en la misma alerta.

**Archivos:** `src/lib/api.ts`, `src/lib/api.test.ts`, `RouteProposalDialog.tsx` y su prueba.

**Validación:** `npm test -- --run src/lib/api.test.ts src/features/company-routes/components/RouteProposalDialog.test.tsx` (19 PASS); `npm run typecheck` y `git diff --check`: PASS.

**Candidato:** este delta Frontend debe consolidarse con el cambio Backend paralelo antes de recalcular el `Candidate-ID` único de FE-016.

## Remediación QA — ayuda accesible del orden

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `b6d8d35 + ac4bee151f2b`

`RouteOrderEditor` usa ahora `route-order-editor-help`; su lista referencia ese ID único y ya no colisiona con la ayuda contextual `route-order-help` del modal. Se añadió regresión que comprueba la asociación y la ausencia del ID del modal dentro del editor.

**Archivos:** `components/RouteOrderEditor.tsx`, `components/RouteOrderEditor.test.tsx`.

**Validación:** `npm test -- --run src/features/company-routes/components/RouteOrderEditor.test.tsx` (7 PASS); `npm run typecheck`; `git diff --check` — PASS.

**Riesgo/reproducción:** abrir «Ordenar borrador» e inspeccionar: `#route-order-help` y `#route-order-editor-help` aparecen una vez cada uno; la lista tiene `aria-describedby="route-order-editor-help"`.
