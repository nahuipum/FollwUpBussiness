# BE-061 — Revisión de ciberseguridad

**Dictamen:** `PASS`  
**Candidate-ID:** `eddddca+98a900eb8d8b` — `HEAD` y digest confirmados.

## Superficie revisada

Revalidación final limitada a `SEC-BE061-01`: detalle autorizado de `GET /routes/{routeId}`, aislamiento por `tenantId`, alcance de vendedor/equipo, estado `PUBLISHED`, reasignación concurrente, carga de puntos y respuesta `404` neutra. Se reutilizan los controles y resultados PASS de QA para el mismo candidato; no se reabrieron fuentes primarias ni superficies sin cambios.

## Cierre del hallazgo

- **SEC-BE061-01 — Media — BOLA/TOCTOU: `PASS`, cerrado.** `ReadRoutesService.get` usa únicamente `RouteStore.findAuthorized`. `JdbcRouteStore.findAuthorized` filtra `tenantId`, `routeId`, vendedores permitidos y, para `SELLER`, estado `PUBLISHED` en la misma sentencia SQL que obtiene los puntos. Ya no existe la secuencia cabecera autorizada → detalle en otra instantánea. Para `COMPANY_ADMIN`/`SUPERVISOR`, la misma consulta recibe el conjunto de vendedores previamente acotado por su alcance.
- **Abuso reproducido — `PASS`:** `ReadRoutesServiceTest#sellerReturnsNeutralNotFoundWhenRouteChangesAfterPreviouslyAuthorizedHeader` modela una cabecera antigua válida para A y una ruta ya reasignada/no autorizada en la lectura atómica. Retorna `NotFound` —mapeado por el controlador a `404` neutro— y verifica que no se invocan `findHeader` ni `find`, por lo que no se cargan puntos mediante una segunda lectura.

## Evidencia

- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ReadRoutesServiceTest#sellerReturnsNeutralNotFoundWhenRouteChangesAfterPreviouslyAuthorizedHeader' test` — `PASS`.
- QA focalizado `ReadRoutesServiceTest` — `PASS`; `clean verify` del candidato base reutilizado según handoff.
- Sin hallazgos nuevos. No aplican al delta: secretos, logs/métricas, almacenamiento local, WebSocket, caché/Redis, mensajería, archivos, dependencias o infraestructura.

## Riesgo residual

Permanece únicamente el riesgo operativo ya aceptado de que `V50` falle ante duplicados históricos `PUBLISHED`; requiere saneamiento previo y no reabre `SEC-BE061-01`.
