# MAP-THEME-2026-09-17 — Security

- Estado: `PASS`.
- Candidate-ID: `359cc48+6a61f6195d5e` (`HEAD` `359cc48`; estado de Git limitado al alcance declarado y artefactos). `git diff --check`: PASS.
- Superficie revisada: ubicación de clientes y rutas en `ClientMap`, `ClientLocationMap` y `RouteSequenceMap`; auxiliar `geoapify-map-theme.ts`; diff y pruebas afectadas.
- Control de solicitudes: PASS. El cambio de tema solo llama a `setStyle` sobre la instancia existente; la URL sigue apuntando a `maps.geoapify.com` con los estilos constantes `dark-matter` u `osm-bright` y la clave codificada como antes. No se añadieron llamadas API, permisos ni consultas de ubicaciones. La carga diferida lee el tema vigente sin crear una segunda instancia.
- Control de datos y registros: PASS. Ni la URL de estilo ni sus parámetros incluyen cliente, usuario, coordenadas o geometría. Marcadores y geometría vial siguen en memoria de MapLibre; el diff no agrega registros, almacenamiento local ni envíos de estos datos. QA verificó 27/27 pruebas focalizadas, incluidas conservación de marcadores/coordenadas y alternativas ante falta de clave o error.
- Hallazgos: ninguno; no hay abuso reproducible nuevo en la superficie modificada. Reproducción adicional: `NOT_EXECUTED`, pues la evidencia del diff y QA no deja un caso capaz de cambiar el dictamen.
- Controles no aplicables: autenticación, aislamiento de tenant, WebSocket, caché/Redis, mensajería, archivos, pagos, dependencias e infraestructura; no cambiaron en este candidato.
- Riesgo residual: al cambiar el tema, MapLibre vuelve a solicitar estilo y teselas al proveedor cartográfico; la clave de mosaicos sigue visible en el cliente como antes. No se detecta una exposición nueva de ubicación exacta.
