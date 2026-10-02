# MAP-THEME-2026-09-17 — QA Frontend

- Estado: `PASS`.
- Candidate-ID: `359cc48+6a61f6195d5e`. El estado de Git corresponde al alcance declarado (tres componentes, sus pruebas, auxiliar compartido y artefactos); `git diff --check` OK.
- Mapeo: `currentGeoapifyMapStyleUrl` consulta el tema vigente dentro de cada callback asíncrono, y las tres pruebas diferidas cambian de oscuro a claro antes de liberar MapLibre; cada instancia se crea con `osm-bright`. Las pruebas previas mantienen inicio oscuro, `setStyle`, una instancia, selección/coordenada/marcadores y estados de carga, error y alternativa textual/manual.
- Rutas registra `style.load` antes de `load`; la prueba dispara ese evento temprano y confirma que `route-sequence` se agrega una sola vez y conserva los dos marcadores. La transición normal de estilo confirma la restauración de la capa vial tras el nuevo estilo.
- Negativo/regresión: falta de clave conserva la lista o captura manual; 422/503 mantiene la alternativa sin exponer coordenadas. No se modifican permisos, acceso directo, sesión/caché de tenant, WebSocket ni consultas de datos.
- Comando: `npm test -- --run src/features/company-clients/components/ClientMap.test.tsx src/features/company-clients/components/ClientLocationMap.test.tsx src/features/company-routes/components/RouteSequenceMap.test.tsx` — 27/27 OK.
- Riesgo residual: no se detectaron bloqueantes; el aviso preexistente de chunks mayores a 500 kB permanece fuera de este cambio.
