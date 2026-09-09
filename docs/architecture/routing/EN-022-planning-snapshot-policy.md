# EN-022 — Contrato de snapshot de planificación

**Estado:** Aceptado para diseño; sin runtime.  
**Autoridad:** ADR-023 y ADR-014.

## Límite y modelo

Una ruta manual tiene 1..50 puntos. `PlanningSnapshot` es un agregado interno de `routing`, durable y tenant-scoped:

| Campo | Regla |
|---|---|
| `snapshotId` | UUID interno; nunca recurso REST directo |
| tenant/ruta | `tenantId`, `routeId` y `baseRouteVersion` obligatorios |
| cálculo | perfil estático, proveedor/versiones, `capturedAt`, hash de contenido |
| tiempo | zona IANA, fecha operativa, `validUntil`, estado y timestamps UTC |
| nodos | 1..50 puntos autorizados; el primero es inicio y el último es fin |
| desplazamiento | matriz dirigida completa de pares entre nodos distintos, segundos/meters positivos |
| restricciones | duración positiva de servicio, ventanas duras y jornada/disponibilidad autorizada |

Estados: `CAPTURING`, `VALID`, `INCOMPLETE`, `FAILED`, `INVALIDATED`, `SUPERSEDED`, `EXPIRED`, `PURGED`. Solo `VALID` permite recálculo. La diagonal no se almacena ni calcula: los puntos son únicos y una pierna nunca conecta un nodo consigo mismo. Un `null` de proveedor para cualquier par distinto deja el snapshot `INCOMPLETE`; nunca se convierte en distancia lineal, cero ni valor por defecto.

La matriz máxima comprende 50 nodos y 2,450 pares dirigidos entre clientes distintos. La primera visita comienza en la jornada y la última termina tras su servicio; no se consulta nodo externo ni diagonal. Su captura se fragmenta solo durante creación/regeneración, conforme al límite del proveedor. Reordenar no reserva cuota ni llama a proveedor externo.

## Fuentes autorizadas de ETA

El caso de uso deriva tenant, actor, rol y equipo de sesión. Cada fuente es un contrato público del dominio propietario; el cliente no es autoridad.

| Entrada | Propietario/fuente pública | Unidad/zona | Captura y ausencia |
|---|---|---|---|
| ruta, versión, fecha y puntos | `routing` / comando y lectura autorizados | UUID; fecha; WGS84 | al crear snapshot; primer cliente inicia y último finaliza |
| coordenada del punto | `customers` / hecho de planificación autorizado | WGS84 SRID 4326 | al capturar; ausente/fuera de rango bloquea captura |
| duración y ventanas | `customers` / hecho de visita planificable autorizado | segundos positivos; ventanas en zona IANA | al capturar; ausencia o ventana inválida bloquea captura |
| vendedor, territorio y equipo | `workforce` / referencia y alcance vigentes | UUID técnicos | al autorizar/capturar; ausencia o fuera de alcance bloquea |
| jornada/disponibilidad | `journeys` / disponibilidad planificable autorizada | ventana en zona IANA | al capturar; ausencia/invalidez bloquea |
| zona horaria | `tenancy` / configuración de empresa | identificador IANA | al capturar; ausencia/invalidez bloquea |
| segundos y metros entre pares distintos | Matrix detrás del puerto de `routing` | segundos/meters positivos; perfil estático | al capturar; `null`, error o cobertura incompleta deja snapshot `INCOMPLETE` |

Los instantes persistidos son UTC. La zona IANA original se conserva para reproducir los límites locales. Solo se entregan coordenadas estrictamente autorizadas al proveedor; nunca tenant, IDs, nombres, direcciones, ventanas, duración, tokens ni payload completo.

### Consulta pública de inicio de jornada para BE-064

Antes de mutar una ruta `PUBLISHED`, `routing` llama al puerto público de aplicación `journeys.JourneyStartedStatusUseCase` con el `tenantId`, `sellerId` y `businessDate` ya obtenidos de la ruta autorizada. No recibe ni interpreta un `journeyId`, ubicación, historial, visitas ni datos personales. `stateForUpdate` devuelve `NOT_STARTED` únicamente cuando no existe un inicio exitoso para esa triple; `STARTED` también cubre una jornada ya cerrada. La implementación de `journeys` bloquea el mismo guard tenant/vendedor/fecha que usa el inicio hasta terminar la transacción invocadora. Si no puede leer o bloquear ese hecho, lanza `Unavailable`: `routing` no lo traduce a permiso y no muta nada. Esta interfaz es interna del monolito y no agrega endpoint REST ni reutiliza `/journeys/start`.

## Ciclo de vida, acceso y retención

La creación/regeneración autorizada captura fuentes, construye la matriz y persiste `VALID` de manera atómica. Un fallo deja la ruta `DRAFT` sin estimaciones confirmadas y snapshot `FAILED`/`INCOMPLETE`; reordenar responde sin efectos. Cambiar puntos, vendedor, territorio, fecha, jornada, ventanas, duración, zona o perfil invalida el snapshot y exige otro. Un reordenamiento que solo cambia la secuencia crea, en su misma transacción, una revisión `VALID` ligada a la nueva `Route.version`, con matriz y restricciones inmutables del snapshot previo; el previo pasa a `SUPERSEDED`. Publicar requiere uno `VALID`; una ruta publicada no puede usar uno de otra versión.

`validUntil` es el fin de la fecha operativa en la zona IANA. Al vencer cambia a `EXPIRED`. Un snapshot invalidado, reemplazado o vencido se conserva 30 días y luego se purga físicamente de PostgreSQL, cache y copias; la restauración se mantiene en cuarentena y purga antes de exponer datos. La auditoría conserva 365 días únicamente acción, resultado, referencias técnicas, versión, hash y `correlationId`; nunca coordenadas ni matriz.

`COMPANY_ADMIN` accede solo mediante casos de uso de rutas de su tenant. `SUPERVISOR` requiere pertenencia vigente del vendedor a su equipo. `SELLER` no puede crear, consultar ni usar snapshots. Toda lectura/escritura filtra por tenant y valida ruta, actor y alcance servidor-side; IDs manipulados no revelan ni conceden acceso. No existe cache, cálculo o reutilización A→B/B→A.

## Puerto y transacción de recálculo

El futuro puerto de aplicación `RecalculateRouteFromPlanningSnapshot` recibe solo la permutación, `routeId` e `If-Match`; deriva contexto de sesión. Sus responsabilidades son autorizar ruta/vendedor/equipo, obtener por `tenantId+routeId+baseRouteVersion` un snapshot `VALID`, comprobar la permutación completa y calcular llegada/salida exclusivamente desde matriz, servicios, ventanas y jornada capturados.

En una única transacción PostgreSQL: bloquear ruta/snapshot vigentes, consultar y conservar el guard de jornada mediante el puerto público, volver a validar versión y autorización, recalcular, escribir orden/ETAs/`Route.version`, crear la revisión `VALID` de igual contenido para esa versión, registrar auditoría saneada y, si la ruta publicada puede editarse, encolar el `route.modified` v1. Si falla cualquier paso, revierten orden, estimaciones, versión, revisión, auditoría y outbox. No se emite éxito, evento ni notificación parcial.

## REST, observabilidad y pruebas

`PUT /routes/{routeId}/points/order` conserva `If-Match`. Para snapshot ausente, incompleto, vencido, obsoleto o versión conflictiva devuelve `409` y un código neutral. Acceso fuera de tenant/rol/equipo conserva la política de no revelación `403/404`; ninguna respuesta revela el snapshot. No hay endpoint de snapshot para Frontend/Mobile.

Logs, métricas, auditoría, errores y evidencia omiten coordenadas, direcciones, clientes, tokens y payloads completos. Solo admiten resultado, latencia, conteos y `correlationId` saneado.

| Riesgo/caso | Evidencia futura mínima |
|---|---|
| determinismo | misma matriz/entradas/permutación → mismos ETA |
| capacidad | 50 puntos/50 nodos y rechazo de 51 |
| aislamiento/BOLA | A→B, B→A, routeId/snapshotId/sellerId manipulados |
| concurrencia | `If-Match` obsoleto y cambio simultáneo; sin partial write |
| rollback | fallo de ETA/auditoría/outbox revierte todo |
| estado snapshot | ausente, incompleto, vencido, invalidado y no autorizado |
| proveedor | cero llamadas/cuota durante reordenamiento |
| privacidad | ausencia de coordenadas/PII en logs, métricas, auditoría y errores |
