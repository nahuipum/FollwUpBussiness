# Paquete de contexto — EN-022 runtime de snapshot

**Estado:** `READY_FOR_HANDOFF`
**Candidate-ID:** `HEAD+a189f4d EN022-5ec390c8640b`.

## Objetivo autorizado

Desbloquear la publicación de rutas manuales sin inferir datos: capturar un
`PlanningSnapshot VALID` antes de publicar, usando duración explícita por
visita, jornada configurada por empresa, zona horaria existente de empresa y
matriz real. Sin datos o matriz completa, la ruta no se publica.

## Decisiones de producto

- No hay duración estándar: cada visita manual declara duración positiva al
  crear la ruta. No se aplican ventanas; toda visita está disponible durante
  la jornada configurada.
- No hay jornada por defecto: `COMPANY_ADMIN` configura inicio y fin de la
  jornada de planificación de su empresa. El primer alcance no agrega override
  por vendedor.
- La zona IANA proviene de `CompanySettings.timezone`; para Lima es
  `America/Lima`.
- La matriz se obtiene por el puerto de routing desde puntos/coordenadas
  autorizadas; no se deriva de la ruta guardada ni se inventa.
- El primer cliente es el inicio y el último cliente es el final de la ruta.
  La primera visita inicia al comienzo de la jornada y no se crea una pierna
  artificial de un cliente hacia sí mismo; el fin ocurre tras el servicio de
  la última visita. La matriz conserva únicamente pares distintos de clientes.

## Límites y controles

- Mantener monolito modular: routing consume únicamente puertos públicos de
  tenancy/customers/workforce/journeys; nunca tablas ajenas. Toda persistencia
  de ruta/snapshot es tenant-scoped.
- Crear/publicar conserva roles, equipo, `If-Match`, idempotencia, auditoría y
  outbox. Seller no configura ni publica.
- Al faltar duración/jornada/matriz válida, no hay `PUBLISHED`, ETA inventado,
  evento ni auditoría de éxito. No exponer coordenadas, matriz ni PII.

## Contratos/superficies esperadas

- Extender settings de empresa con jornada local de planificación; contrato y
  UI de Company Settings, con control de versión.
- Extender creación manual con visitas `{ customerId, serviceDurationSeconds }`
  y conservar compatibilidad solo si no contradice el contrato actual.
- Añadir captura persistente de `PlanningSnapshot` en routing conforme a
  `docs/architecture/routing/EN-022-planning-snapshot-policy.md`; no crear un
  endpoint de snapshot ni cambiar `route.published`.

## Evidencia de partida

- `docs/stories/enablers/EN-022-definir-snapshot-de-planificacion-y-estimaciones-de-ruta.md`.
- `docs/api/openapi.yaml`: `CreateRouteRequest`, `CompanySettings`,
  `OptimizeRouteRequest`; `CompanySettings.timezone` ya existe.
- `routing` contiene `PlanningSnapshot`, `TravelMatrix` y lectura de snapshot,
  pero no captura/persistencia inicial.

## Delta Development

- La creación manual recibe visitas con duración positiva explícita, guarda un
  snapshot `VALID` tenant-scoped solo con jornada configurada y matriz completa.
  La ausencia de jornada o matriz completa conserva `DRAFT` con snapshot
  `INCOMPLETE`; publicar continúa bloqueado por el control existente.
- Se añadió jornada local opcional (sin valor por defecto) a settings de empresa
  y la migración `V53`. Se consultó la política EN-022 por la contradicción con
  el handoff BE-024 previo; no se abrió nuevo contrato de snapshot ni se cambió
  `route.published`.

## Delta Frontend

- Company Settings muestra y persiste inicio/fin local atómicos de la jornada
  sólo para `COMPANY_ADMIN`; supervisor queda en lectura y seller recibe estado
  prohibido sin consultar settings. La caché/ETag se invalida en cambio de sesión.
- La creación manual envía `visits[{customerId,serviceDurationSeconds}]` y exige
  segundos positivos por visita. La UI no solicita ventanas. Un `409` de publicar
  se explica como bloqueo de snapshot/jornada sin atribuir concurrencia falsa.
- Remediación contractual: `CreateRouteRequest.visits` ahora declara objetos
  con `customerId` y `serviceDurationSeconds >= 1`; el ordenamiento conserva
  `routePointIds` UUID. Un test de política verifica ambas superficies.
- Remediación final Frontend: el formulario y payload de creación no contienen
  `startLocation`; el orden de `visits` representa inicio (primer cliente) y
  final (último cliente), conforme al contrato corregido.

## Delta QA autorizado

- El primer cliente inicia la ruta en `planningDayStart` y el último concluye
  tras su servicio. No hay `startLocation` de entrada, nodo externo ni piernas
  `START`/diagonales: la matriz contiene sólo pares distintos de clientes.

## Delta Security

- Publicar rechaza snapshot cuyo `validUntil` no es futuro, antes de ruta,
  auditoría u outbox. Cambiar zona o jornada invalida snapshots `VALID` del
  tenant dentro de la transacción de settings.
- Captura fragmentada: bloques de cinco clientes, máximo diez coordenadas por
  llamada, componen todos los pares dirigidos. Cualquier respuesta parcial o
  error deja `INCOMPLETE`; no se introduce cero, distancia ni ETA inventada.
- La captura compara de nuevo la versión de settings antes de `saveValid`; si
  cambió, queda `INCOMPLETE`. Pares no diagonales con segundos o metros `<=0`
  se rechazan. Para restos de un cliente se usan bloques de cuatro, evitando
  llamadas de un solo nodo.

## Delta de remediación puntual

- La prueba de matriz incompleta ahora usa dos clientes y una respuesta parcial;
  se conserva el caso de una visita sin piernas que captura `VALID` sin invocar
  la matriz.
