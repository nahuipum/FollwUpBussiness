# BE-026 — Handoff Development

**Estado: READY_FOR_HANDOFF**  
**Candidate-ID:** `HEAD 9aae01d + 4fef2ff15cc3`

## Alcance

Implementado `POST /routes/{routeId}/copy`: crea un `DRAFT` independiente para fecha futura distinta, vendedor destino activo y nombre opcional; no modifica la fuente ni copia estimaciones. La autorización exige `COMPANY_ADMIN` o que `SUPERVISOR` alcance vendedores fuente/destino. `SELLER` recibe 403 sin escritura.

Los puntos se regeneran y renumeran; inactivos, fuera de cartera o de territorio activo se omiten con warnings sin PII. Si no queda ninguno, persiste borrador vacío. La fuente con vendedor inactivo advierte y procede. Idempotencia `COPY` rechaza payload incompatible con 409.

## Archivos y contrato

- Routing: `CopyRouteService`, `CopyRouteUseCase`, `RouteStore`, `JdbcRouteStore`, `RoutingConfiguration`, `RouteController`, `Route`.
- Contrato: [openapi.yaml](../../api/openapi.yaml), con `CopyRouteResponse` y warnings permitidos.
- Sin migración: la columna/clave `operation` existente admite `COPY`.

## Evidencia

- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=CopyRouteServiceTest test` — PASS (3 casos).
- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' -Dtest=HexagonalArchitectureTest test` — PASS.
- `mvn -q clean verify '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository'` — ejecutado; PASS.
- `git diff --check` — PASS.

## Criterios y riesgo

Cubiertos: éxito, fuente inactiva, omisión de cliente, borrador vacío, aislamiento de supervisor, idempotencia y ausencia de efectos secundarios de la fuente. Riesgo residual: `TERRITORY_NOT_EFFECTIVE` usa la referencia pública vigente (estado `ACTIVE`); no existe una vigencia temporal de territorios en el contrato actual. Reproducción: copiar una ruta con fecha futura y destino autorizado; inspeccionar `201`, nuevos IDs y `warnings` sin PII.

## Remediación SEC-BE026-01

La autorización se ejecuta antes de comparar la fecha solicitada con la de la fuente. La prueba cubre que un supervisor fuera de ambos alcances obtiene `Forbidden` para fecha igual y distinta, sin reserva idempotente, persistencia ni auditoría de éxito. `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=CopyRouteServiceTest,HexagonalArchitectureTest' test` — PASS; `git diff --check` — PASS.
