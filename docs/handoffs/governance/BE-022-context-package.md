# Paquete de contexto — BE-022

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `db27cc3+4ec4aabeae61` (recalculado sobre el diff vigente; los archivos nuevos siguen sin indexar).

## Alcance

Implementar `POST /routes/optimize` conforme a OpenAPI: propuesta versionada, no publicada, para una ruta existente `DRAFT`, un vendedor y 1..9 visitas; sin tráfico, navegación, publicación, reasignación ni fallback. Reutilizar ADR-014/EN-018: matriz Mapbox `driving` detrás de puerto neutral y solver neutral (OR-Tools aprobado). No crear ADR ni secretos.

## Invariantes de control

- Éxito: valida tenant, rol, ruta `DRAFT`, vendedor, territorio, clientes/cartera y versión base antes de matriz; persiste propuesta/snapshot versionado, `published=false`, sin alterar ruta/puntos ni emitir `route.*`.
- Denegación: rol no permitido, recurso cross-tenant, vendedor/equipo/cartera/territorio no autorizados impiden matriz, solver, persistencia, auditoría de éxito y eventos.
- Conflicto: versión base diferente retorna `409`, sin propuesta ni sobrescritura humana.
- Fallo: matriz/proveedor/solver indisponible retorna `503` seguro (con `Retry-After` si aplica); la ruta manual queda intacta y no hay proveedor alterno.
- Privacidad/observabilidad: el adaptador Matrix recibe exclusivamente lon/lat WGS84; logs, auditoría, eventos, métricas y errores excluyen coordenadas, matriz, PII, IDs de negocio, URL autenticada y token; conservar `CorrelationId`.

## Decisiones verificadas

- Límites: un vendedor, inicio y fin explícitos (pueden diferir), 1..9 clientes, 3..11 nodos, conducción estática, jornada única, ventanas duras, duración positiva, timeout solver configurable 2 s/máximo 5 s; objetivo prioridad → viaje → distancia.
- `null` de matriz significa no enrutable; ventana/jornada inviable queda en `unassignedVisits`, nunca se relaja ni se aproxima por línea recta. El timeout del solver puede devolver mejor factible `TIME_LIMIT`.
- Versionado: persistir versión de propuesta monotónica, `baseRouteVersion`, fecha/territorio, actor/tenant, hashes de entrada y matriz, snapshot/ referencia inmutable de coordenadas y matriz, proveedor/perfil/unidades, configuración solver y orden original. Edición humana posterior es `MANUAL_EDIT`; regenerar no la reemplaza.
- Solo `route.published` existe para publicación posterior (BE-024); optimizar no genera outbox ni notificación/mobile.
- La zona IANA autorizada proviene de configuración de empresa; instantes persistidos en UTC y zona original en snapshot. La cuota operacional es 35 matrices/día por cuenta; métricas sin etiquetas de IDs.

## Contrato y superficies

Fuente de contrato: `docs/api/openapi.yaml` (`/routes/optimize`, `OptimizeRoute*`, `RouteOptimizationUnavailable`). Mantener `400/403/409/422/503` y códigos `PROVIDER_UNCONFIGURED`, `PROVIDER_UNAUTHORIZED`, `PROVIDER_RATE_LIMITED`, `PROVIDER_TIMEOUT`, `PROVIDER_INVALID_RESPONSE`, `SOLVER_LIMIT` sin detalles sensibles. `CorrelationId` es obligatorio.

Base existente: `routing` dispone de rutas/puntos y persistencia `V42`; el SQL contiene estado `DRAFT`, aunque el agregado/lector debe materializarlo para autorizar la optimización. Existen puertos públicos de cartera, alcance de supervisor, vendedores y territorios; no acceder a persistencia de otro módulo.

## Validación requerida

Pruebas de dominio/caso de uso, REST/contrato, persistencia/seguridad y dobles del adaptador para éxito, `null`, 401/403/422/429/timeout/5xx. Cubrir alcance de Admin/Supervisor, cross-tenant, versión obsoleta, ventanas/jornada/prioridad, no publicación y ausencia de llamada Matrix en denegación. Cambios de migración, configuración, seguridad y composición exigen `mvn -q clean verify`, además de arquitectura (`HexagonalArchitectureTest`, `ModuleBoundaryTest`). Live Mapbox queda bloqueado si no hay credenciales: usar doubles, sin inventar secretos.

## Resolución autorizada del bloqueo

El usuario autorizó crear la superficie pública mínima necesaria. Development debe extender, sin exponer persistencia ni datos personales:

- `SellerReferenceUseCase`: predicado tenant-scoped para vendedor activo asignado al territorio activo solicitado.
- `CustomerPortfolioReadUseCase.RouteCustomer`: incluir `territoryId` del cliente retornado ya validado como activo y asignado al vendedor en la fecha operativa.

`routing` requiere ambas condiciones antes de Matrix. La solución no crea acceso de `routing` a adaptadores/SQL de Customers o Workforce y no cambia OpenAPI.

## Delta Development

Candidate `db27cc3+9dbb998e8948`: endpoint, caso de uso, puertos neutrales, propuesta no publicada versionada y migración `V43`; rutas ahora materializan estado. Matrix runtime queda fail-closed sin configuración y pruebas usan doubles. Development informa `mvn -q clean verify`, pruebas focalizadas y `git diff --check` en `PASS`. Riesgo: Mapbox/OR-Tools productivos no están disponibles; QA debe comprobar REST/503, ausencia de eventos y cobertura contractual restante.

## Delta QA

`CHANGES_REQUIRED` sobre `db27cc3+9dbb998e8948`: el solver no aplica jornada, ventanas duras ni prioridad, ni produce `unassignedVisits`; `503` fail-closed carece de código contractual seguro. Faltan validaciones `422` y garantía de atomicidad/versionado. Remediación limitada a esos hallazgos y sus pruebas; después revalidar QA. Sin iniciar Seguridad/DoF.

## Delta Development (remediación)

Se añadieron tratamiento de jornada/ventanas duras con `unassignedVisits`, validación `422`, respuesta fail-closed `application/problem+json` con `PROVIDER_UNCONFIGURED` y sincronización transaccional local de propuesta/versionado. Development declara `mvn -q clean verify` y `git diff --check` en `PASS`. La firma recomputada continúa `db27cc3+9dbb998e8948`; QA debe comprobar que el cambio es observable y que cierra exactamente sus hallazgos.

## Delta QA (revalidación)

`CHANGES_REQUIRED`: cerró solo `503` seguro y no publicación. Persiste un hallazgo crítico: la remediación eliminó el control de rol y alcance de supervisor antes de Matrix. También persisten prioridad, matriz `null`, `422` incompleto y concurrencia multiinstancia. Evidencia focalizada y `git diff --check` pasan, pero no cierran los criterios. Se agotó la única corrección Development→QA permitida por historia; no ejecutar Security ni DoF en este candidato.

## Delta Development (evidencia BE-022)

`READY_FOR_HANDOFF` sobre `db27cc3+de99decbd768`: pruebas reales ejercen `OptimizeRouteService` con matriz asimétrica a través de `optimize` (prioridad, arcos y totales), rol/scope denegados sin Matrix, `Invalid`/`Unavailable`, REST `422`/`503`, y propuesta no publicada. Prioridad `<= 0` se rechaza como `Invalid` antes de Matrix; la no asignación separa `TIME_WINDOW_CONFLICT` de `OUTSIDE_SHIFT`. `JdbcRouteProposalStoreConcurrencyTest` usa Testcontainers PostgreSQL, Flyway, dos transacciones sincronizadas por `CyclicBarrier`, advisory lock y persistencia de versiones 1/2 sin excepción. El ejercicio reveló y corrigió la lectura errónea del retorno `void` del lock y un placeholder SQL extra. `mvn -q -Dtest=OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest test`, `mvn -q clean verify` y `git diff --check`: PASS. QA debe revalidar el candidato actualizado; no iniciar Security/DoF aún.

## Delta Development (Seguridad)

`READY_FOR_HANDOFF` sobre `db27cc3+2b1de946e414`: antes de cuota/Matrix, la ruta debe coincidir con `sellerId` y fecha del comando; las dos denegaciones no llaman Matrix ni persisten. Se añadió `MatrixQuota` neutral, adaptador JDBC y migración `V44`: reserva atómica por tenant/cuenta/día con límite 35 antes del proveedor. El excedente retorna `RateLimited`, mapeado a `503 PROVIDER_RATE_LIMITED` sin IDs expuestos. Pruebas focales incluyen 36 reservas PostgreSQL simultáneas con `CyclicBarrier` (exactamente 35 permitidas), además de denegaciones observables. `mvn -q -Dtest=OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest,JdbcMatrixQuotaIntegrationTest test`, `mvn -q clean verify` y `git diff --check`: PASS. Requiere QA y nueva validación de Seguridad; no iniciar DoF.

## Delta Development (Seguridad durable)

`READY_FOR_HANDOFF` sobre `db27cc3+4ec4aabeae61`: `JdbcMatrixQuota` recibe el transaction manager y reserva con propagación `REQUIRES_NEW` antes de Matrix; un fallo de Matrix/solver/propuesta en la transacción exterior no revierte el cupo. La integración Testcontainers fuerza 35 `Unavailable` posteriores dentro de transacciones exteriores, confirma `used_matrices=35`, cero propuestas y exactamente 35 llamadas Matrix; la llamada 36 se rechaza `RateLimited` antes de Matrix. `mvn -q -Dtest=JdbcMatrixQuotaIntegrationTest,OptimizeRouteServiceTest,RouteOptimizationControllerTest,JdbcRouteProposalStoreConcurrencyTest test`, `mvn -q clean verify` y `git diff --check`: PASS. Requiere QA y revalidación Seguridad; no iniciar DoF.
