# PASS — Seguridad FE-014–FE-017 visual de Rutas

**Candidate-ID:** `574be0e + 3c274a322bc0`, verificado con HEAD y digest del diff de Rutas.

**Superficie revisada:** permisos de gestión y publicación, aislamiento por sesión y empresa, ubicaciones de clientes, mapa y flujos de creación, optimización y orden. Se revisaron el paquete, el handoff QA y el código afectado.

**Hallazgos:** ninguno reproducible. La lista y el detalle limpian datos al cambiar la sesión; la lista elimina resultados ante 403/404. Las acciones de gestión requieren el rol correspondiente; propuesta y publicación se ofrecen para DRAFT, con confirmación explícita. Los conflictos de versión conservan la revisión. El mapa usa ubicaciones válidas y geometría recibida, sin inventar coordenadas ni recorridos.

**Evidencia:** revisión de `CompanyRoutesPage`, `RouteWorkspace`, `RouteDetailDialog`, `useRouteDraft`, `useRouteDirections`, `RouteSequenceMap` y variantes compartidas. Validación Dev y QA del mismo candidato: **PASS**. Reproducción adicional de abuso: **NOT_EXECUTED**; no surgió un caso capaz de cambiar el veredicto.

**Delta FE-016:** la prioridad opcional envía `1` para visitas sin prioridad especial y `2/3/4` para las explícitas, conservando `routeId`, `baseRouteVersion` y la selección de visitas. QA verificó `4/2/1` y el restablecimiento a `1` (**PASS**). «Cambiar modo» no optimiza ni publica. El delta no cambia permisos, cartera, sesión/empresa, aislamiento, contrato ni DRAFT persistido. Hallazgos nuevos: ninguno.

**Controles no aplicables al diff:** secretos, almacenamiento local, WebSocket, caché/Redis, mensajería, archivos, dependencias e infraestructura.

**Riesgo residual:** la vista cartográfica sigue dependiendo del proveedor configurado y de ubicaciones reales; sus estados de fallo conservan la secuencia textual.
