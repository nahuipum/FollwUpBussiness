# EN-018 — Contrato neutral del motor de rutas

Este contrato traduce ADR-014 a tipos, límites y estados consumibles. No
implementa BE-022, endpoints, persistencia, adaptadores runtime ni publicación.

## Límites

| Concepto | MVP |
|---|---|
| Vendedores por solicitud | 1 |
| Clientes | 1 a 9 |
| Inicio y final | obligatorios; distintos permitidos |
| Nodos | máximo 11 |
| Perfil | conducción estática, sin tráfico en tiempo real |
| Jornada | una ventana válida |
| Ventanas de cliente | opcionales y duras |
| Duración de servicio | obligatoria por cliente |
| Solver | 2 s objetivo, máximo 5 s |

## Puerto neutral futuro

```text
RouteProposalRequest
  routeId: UUID o referencia neutral
  baseRouteVersion: entero positivo
  operationDate: ISO date
  sellerRef: referencia interna autorizada
  territoryRef: zona interna autorizada
  start: RouteLocation
  end: RouteLocation
  availability: TimeWindow
  customers: lista RouteVisit [1..9]

RouteLocation
  latitude: decimal [-90, 90]
  longitude: decimal [-180, 180]
  srid: 4326

RouteVisit
  customerRef: referencia interna; nunca se envía al proveedor
  location: RouteLocation
  serviceDurationSeconds: entero positivo
  priority: entero normalizado por contrato futuro
  windows: lista TimeWindow

TravelMatrix
  nodeCount: entero [3..11]
  durationsSeconds: matriz cuadrada nullable
  distancesMeters: matriz cuadrada nullable
  provider: metadato interno
  profile: metadato interno
  capturedAt: instant
  contentHash: SHA-256

RouteProposal
  proposalVersion: entero positivo
  baseRouteVersion: entero positivo
  orderedVisits: lista ProposedVisit
  unassignedVisits: lista UnassignedVisit
  totalTravelSeconds: entero
  totalServiceSeconds: entero
  totalDistanceMeters: entero
  optimality: FEASIBLE | OPTIMAL | TIME_LIMIT
  generatedAt: instant
  inputHash: SHA-256
  matrixHash: SHA-256

UnassignedVisit
  customerRef: referencia interna
  reason: OUTSIDE_SHIFT | TIME_WINDOW_CONFLICT | UNREACHABLE | LIMIT_EXCEEDED
```

Los nombres son contractuales/conceptuales; BE-022 decidirá DTO y OpenAPI.
No se exponen clases de OR-Tools, Mapbox, Geoapify u OSRM.

## Semántica

1. El caso de uso deriva tenant y actor de la sesión.
2. Autoriza vendedor, territorio, clientes y ruta dentro del tenant.
3. Valida límites, coordenadas, jornada, duración y ventanas.
4. Construye una lista local de nodos: inicio, clientes y final.
5. El adaptador Matrix recibe únicamente coordenadas y perfil estático.
6. Normaliza segundos/metros y conserva `null` como no enrutable.
7. El solver aplica restricciones y prioridad.
8. La aplicación genera una propuesta versionada, nunca una publicación.

Las ventanas se expresan respecto de `operationDate` y una zona horaria
IANA determinada por configuración autorizada. Los instantes persistidos usan
UTC; la zona original forma parte del snapshot reproducible. No se infiere zona
horaria desde Mapbox.

## Objetivo y prioridad

La prioridad no modifica la matriz. Se representa como penalización por visita
no asignada, con orden estricto entre niveles. El objetivo es lexicográfico:

1. maximizar valor total de visitas atendidas;
2. minimizar segundos de desplazamiento;
3. minimizar metros como desempate estable.

Una visita fuera de su ventana o que excede jornada no se fuerza. El resultado
la incluye en `unassignedVisits`. No se relajan ventanas ni se convierte
`null` a línea recta sin una decisión posterior.

## Validaciones previas

- cliente, vendedor, territorio, ruta y puntos pertenecen al tenant autenticado;
- el territorio está activo y cada visita pertenece a la zona solicitada;
- inicio/final presentes, SRID 4326 y coordenadas en rango;
- 1..9 clientes, sin duplicados de negocio;
- disponibilidad con inicio anterior a fin;
- duración de servicio positiva y acotada por la jornada;
- ventanas válidas y compatibles con la fecha operativa;
- versión base vigente para evitar sobrescritura concurrente.

El proveedor no recibe `tenantId`, `territoryId`, referencias, nombres,
direcciones, prioridades, ventanas, duración, vendedor, ruta ni fecha operativa.

## Estados y errores neutrales

| Estado | Naturaleza | Acción permitida |
|---|---|---|
| `PROVIDER_UNCONFIGURED` | permanente/configuración | manual; alerta |
| `PROVIDER_UNAUTHORIZED` | permanente/seguridad | deshabilitar; rotar clave |
| `PROVIDER_RATE_LIMITED` | temporal | respetar Retry-After; reintento manual |
| `PROVIDER_TIMEOUT` | temporal | manual o reintento controlado |
| `PROVIDER_INVALID_REQUEST` | permanente | corregir entrada/configuración |
| `UNREACHABLE_NODE` | dato | excluir explícitamente o editar manual |
| `NO_FEASIBLE_PROPOSAL` | negocio | mostrar causas; editar restricciones |
| `SOLVER_TIME_LIMIT` | técnico | usar mejor factible marcada o manual |

No existe fallback automático a otro tercero. El error estándar futuro debe
incluir `correlationId` sin revelar token, URL autenticada, coordenadas o matriz.

## Cuota y control de consumo

- 121 elementos por matriz máxima 11×11.
- 79,860 elementos/mes: 30 vendedores × 22 días × 121.
- máximo operativo: 35 matrices/día por cuenta.
- umbrales: 70%, 80%, 90% y apagado al 95% de 100,000 elementos.
- edición de orden reutiliza matriz; no consume otra solicitud.
- claves y contadores separados por ambiente; claves de cache futuras incluyen
  tenant, hash de nodos, perfil y versión.

El portal del proveedor es autoridad de cuota. Los contadores locales son una
estimación y no incorporan IDs de negocio como etiquetas métricas.

## Versionado y edición

Una propuesta conserva `baseRouteVersion`, `proposalVersion`, fecha operativa,
territorio autorizado, hashes de entrada y matriz, configuración/versión del
solver, perfil, unidades e instante. El orden automático original es inmutable.

Una edición humana crea una revisión posterior con origen `MANUAL_EDIT`, actor,
instante y referencia a propuesta. Regenerar parte de una versión base explícita
y nunca reemplaza edición ni publica. Si la versión cambió, se devuelve conflicto
de concurrencia; no se hace last-write-wins.

## Seguridad y observabilidad

- token Matrix solo server-side, inyectado, restringido y rotado;
- nunca se registra token, query autenticada, matriz o coordenadas completas;
- cache/rate limit/locks segregados por tenant;
- métricas: elementos, latencia, resultado, solver ms, asignados/no asignados;
- auditoría futura: solicitud, aceptación/rechazo, edición y publicación;
- pruebas negativas: cross-tenant, recurso inactivo y versión obsoleta.

## Flags futuras

BE-022 puede materializar nombres equivalentes, sin aceptarlos desde el cliente:

```text
routeOptimizationEnabled
routeMatrixProvider
routeOptimizationMaxCustomers
routeOptimizationDailyMatrixLimit
routeOptimizationSolverTimeout
```

## Evidencia exigida a BE-022/FE-016

- preservar el OpenAPI EN-018 y sus errores neutrales `409`/`503`;
- adapter fake para éxito, `null`, 401, 403, 422, 429, timeout y 5xx;
- OR-Tools productivo evaluado y aprobado como dependencia separada;
- pruebas de ventanas, duración, prioridades, borde de jornada y concurrencia;
- aislamiento tenant y autorización por recurso;
- propuesta editable y no publicada automáticamente;
- fallback manual visible y sin pérdida de trabajo;
- matriz/cuota observables sin información personal.

## Compatibilidad de eventos y mobile

`route.published` versión 1 sigue siendo suficiente: optimizar produce una
propuesta no publicada y por tanto no emite ese evento. Solo la confirmación
explícita posterior de BE-024 puede publicar. Mobile continúa consumiendo
`Route.version` mediante bootstrap/snapshot; la propuesta administrativa no se
sincroniza hasta convertirse en una ruta publicada. No se requiere modificar
el catálogo de eventos ni el contrato sync para EN-018.
