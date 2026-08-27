# BE-022 — Revisión de Seguridad

**Estado:** `PASS`
**Candidate-ID:** `9e030b7+704024ea0bf7`

## Superficie revalidada

Cierre de `SEC-BE022-DIR-01` y `SEC-BE022-DIR-02` en `GET /routes/{routeId}/directions`: origen del token y validación fail-closed de la respuesta Mapbox. No se reabrieron controles sin cambios del candidato anterior.

## Resultado y evidencia

- `PASS` — `RoutingConfiguration` obtiene el token únicamente mediante `System.getenv("MAPBOX_DIRECTIONS_TOKEN")`; se eliminó el binding `MapboxDirectionsProperties` y `application.yaml` ya no declara la propiedad Directions. El import global opcional de `.env` no alcanza esta lectura directa. No aparece el token Mapbox en frontend ni logs.
- `PASS` — `MapboxDirectionsAdapter` rechaza respuestas 2xx sin ruta utilizable: exige métricas numéricas finitas/no negativas, geometría con al menos dos coordenadas válidas y exactamente un tramo por cada par solicitado. El fallo se tipa `Unavailable` y conserva el `503 DIRECTIONS_UNAVAILABLE` seguro.
- Reproducción decisiva sin red: `mvn -q '-Dmaven.repo.local=C:\\Users\\LUIS\\.m2\\repository' '-Dtest=MapboxDirectionsAdapterTest#failsClosedForHttpSuccessWithoutUsableRoute' test` — `PASS`; el doble HTTP 200 con `{"routes":[{}]}` fue rechazado.

## Hallazgos y riesgos residuales

Sin hallazgos abiertos; `SEC-BE022-DIR-01` y `SEC-BE022-DIR-02` quedan cerrados. Se reutiliza el `PASS` previo de autorización tenant/rol antes del proveedor, payload solo lon/lat, error sin secretos/URL/IDs/coordenadas y caché local `routeId+version` no persistida.

Controles no aplicables: WebSocket, Redis, mensajería y archivos. `NOT_EXECUTED`: llamada Mapbox live y QA integral de Directions. Riesgos residuales: disponibilidad/coste del proveedor y caché en memoria sin límite/TTL. Advertencia de trazabilidad: el handoff QA BE-022 aún referencia el candidato anterior; esta revalidación se limita a la remediación explícitamente solicitada.

## Delta — origen implícito

**PASS** — El origen implícito habilita el cálculo vial para rutas sin `startLocation`, pero no amplía la forma de los datos enviados al proveedor: sigue recibiendo únicamente lon/lat de visitas ya incluidas, sin tenant, actor ni identificadores de cliente. `ReadRoutesUseCase.get(routeId, actor)` autoriza antes de construir coordenadas, usar caché o invocar el proveedor.

- Abuso reproducido: `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=GetRouteDirectionsServiceTest#crossTenantOrUnauthorizedRouteNeverCallsProvider' test` — PASS; `NotFound` y cero interacciones con el proveedor.
- Contrato: OpenAPI describe origen implícito, mínimo de dos puntos sin origen explícito y no persistencia.

Sin hallazgos. Riesgo residual: Mapbox procesa coordenadas y se mantiene la disponibilidad/coste externo; no se ejecutó llamada live.
