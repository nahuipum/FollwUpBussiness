# BE-021 — Revisión de Seguridad

**Estado:** `PASS`  
**Candidate-ID:** `27f65e2+BE021-F21FF90E9F50`

## Superficie revisada

Remediación del replay idempotente de `POST /routes`: rol `SUPERVISOR`, aislamiento por tenant/actor, autorización vigente de vendedor/equipo/cartera, exposición de IDs y coordenadas, ausencia de escrituras, auditoría de éxito y eventos ante denegación. Se verificó además la conservación del replay autorizado.

## Hallazgos y evidencia

Sin hallazgos abiertos. El hallazgo Medio anterior queda cerrado: tras validar que el fingerprint coincide, `CreateRouteService` ejecuta `authorizeCurrentAccess` antes de `routes.find`. Esa función exige vendedor activo, alcance actual del actor y todos los clientes activos asignados al vendedor para la fecha operativa.

Reproducción focalizada:

- `deniesExactReplayAfterSupervisorLosesSellerScopeWithoutReadingRoute`: `PASS`; la pérdida de equipo produce `Forbidden` —traducido por el controlador a `403`— antes de leer/exponer la ruta, y confirma ausencia de `find`, `save` y auditoría. No existen puertos de eventos/outbox en este flujo.
- `exactReplayReturnsOriginalAndChangedPayloadConflictsWithoutWrites`: `PASS`; con autorización vigente, el replay exacto conserva la ruta y un fingerprint diferente mantiene `409` sin escritura.

Comando focalizado Maven y `git diff --check`: `PASS`.

## No aplicable y riesgos residuales

Sin cambios nuevos en secretos, archivos, WebSocket, cache/Redis, mensajería, dependencias o infraestructura. Revocación vía REST/PostgreSQL y concurrencia: `NOT_EXECUTED`; se conserva el riesgo QA de integración, sin impacto en este veredicto focalizado.
