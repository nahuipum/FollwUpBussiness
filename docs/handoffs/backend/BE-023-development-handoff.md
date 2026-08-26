# BE-023 — Handoff Development

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD+ff8fac1 BE023-7f735f969c32`

## Alcance y evidencia

- Implementado `PUT /routes/{routeId}/points/order` en [RouteController.java](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/adapter/in/rest/RouteController.java), con `If-Match`, ETag, correlación segura y respuestas 403/409/422.
- [ReorderRoutePointsService.java](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/application/ReorderRoutePointsService.java) autoriza por tenant/equipo antes de acceder al snapshot; exige `DRAFT`, versión y permutación completas; no usa proveedor/cuota; recalcula ETA desde matriz/servicio/ventana/jornada capturados.
- [V45__add_route_planning_snapshots.sql](C:/Users/LUIS/OneDrive/Escritorio/FollowUpBussiness/FollwUpBussiness/backend/followupbussiness/src/main/resources/db/migration/V45__add_route_planning_snapshots.sql) añade ETAs y snapshot PostgreSQL. El éxito actualiza orden y versión atómicamente, crea revisión `VALID`, supersede la previa y registra auditoría sin coordenadas/PII. No hay evento/notificación en `DRAFT`.
- Se restaura el máximo contractual de creación a 500 en validación y OpenAPI; se cubre explícitamente el borde de 500. La consulta de EN-022/ADR-023 fue necesaria por la nueva superficie snapshot; no quedó ambigüedad.

## Pruebas

- `mvn -q "-Dtest=CreateRouteServiceTest,ReorderRoutePointsServiceTest" test` — PASS: borde de 500, éxito determinista y denegación por alcance sin snapshot/escritura/auditoría.
- `mvn -q clean verify` — PASS, incluyendo Flyway V45 y suite local.
- `git diff --check` — PASS.

## Criterios y riesgo residual

Cubre éxito con secuencia `1..n`, `If-Match`, autorización, aislamiento tenant/equipo, conflictos de snapshot/estado/versión, rollback transaccional y observabilidad saneada. Reproducir: crear una ruta `DRAFT` con snapshot `VALID` de su versión, enviar la permutación completa y ETag vigente; repetir con ETag vencido o sin snapshot devuelve 409 sin efectos. Riesgo: la captura/regeneración autorizada del primer snapshot corresponde al flujo futuro definido por EN-022; una ruta histórica sin snapshot queda correctamente bloqueada.
