# Paquete de contexto — BE-024

**Estado:** `BLOCKED`
**Candidate-ID:** `a189f4d + sin diff Backend BE-024 (bloqueado antes de implementación)`

## Alcance

`POST /routes/{routeId}/publish` para `COMPANY_ADMIN` y `SUPERVISOR`, con
tenant y equipo derivados de sesión, `If-Match`, idempotencia, auditoría y
outbox transaccional de `route.published` v1. Quedan fuera Mobile, push y
entrega de notificaciones.

## Delta de remediación autorizada

Las rutas manuales creadas por `CreateRouteService` no persisten un
`PlanningSnapshot`, pero `PublishRouteService` exige uno `VALID`, causando
`409` invariable. Implementar dentro de `routing` la captura/persistencia de
un snapshot válido al crear una ruta manual, usando únicamente las fuentes y
reglas ya aprobadas en `docs/architecture/routing/EN-022-planning-snapshot-policy.md`.
Si faltan datos, matriz o fuente autorizada, no inventar ETA/distancias: dejar
la ruta `DRAFT` y registrar snapshot `INCOMPLETE`/`FAILED` conforme a política.
No cambia el endpoint público de publicación, el evento ni el contrato push.

## Invariantes de la remediación

- `tenantId`, actor y alcance del vendedor se derivan de sesión; Admin/Supervisor
  mantienen autorización por recurso/equipo y Seller no puede producir snapshots.
- Un `VALID` queda ligado a `routeId + version` y se escribe atómicamente con
  la creación de la ruta; si la captura falla, no hay publicación, ETA inventado
  ni éxito parcial.
- La matriz y datos de planificación no salen en logs, auditoría, eventos ni
  respuestas. Publicar conserva `If-Match`, idempotencia, auditoría y outbox.

## Invariantes preparados

- Éxito: una ruta `DRAFT`, autorizada, con vendedor activo y snapshot `VALID`
  de su versión pasa a `PUBLISHED`, incrementa versión y persiste auditoría y
  outbox en la misma transacción.
- Denegación/rechazo/conflicto: no hay cambio, evento ni auditoría de éxito
  para alcance inválido, estado no publicable, vendedor inactivo, snapshot
  inválido, `If-Match` obsoleto o idempotencia incompatible.
- Observabilidad: solo IDs técnicos y `correlationId`; sin PII, coordenadas,
  tokens ni payload completo.

## Decisiones verificadas

- BE-023 establece `DRAFT` como único estado editable.
- EN-022 exige un `PlanningSnapshot` `VALID` ligado a la `Route.version` para
  publicar.
- `route.published` v1 está registrado para `routing`; su envelope contiene
  únicamente los campos técnicos autorizados y se guarda en outbox con la
  transición.

## Decisión MVP aprobada por Orquestación

`notifySeller=false` no suprime `route.published`, no altera sus destinatarios
técnicos ni afecta publicación, versión, auditoría, autorización o Mobile.
Siempre se encola el evento para que Mobile reciba la transición. El campo se
propaga como booleano técnico opcional del envelope: BE-053 deberá omitir solo
el push cuando sea `false`; seguirá validando tenant, destinatario e
instalación. Su ausencia equivale a `true` por compatibilidad v1.

El booleano no contiene PII, ubicación, secretos ni contenido visible; es una
adición opcional compatible con `route-notification/v1`.

## Bloqueo de Development

**Motivo de consulta primaria:** el paquete no identifica los contratos públicos
que aportan las restricciones exigidas para un snapshot `VALID`; se consultó
`EN-022`, secciones «Fuentes autorizadas de ETA» y «Ciclo de vida» (líneas
24–46) para resolver esa ambigüedad.

`CustomerPortfolioReadUseCase.RouteCustomer` solo expone ubicación y territorio;
`JourneyStartedStatusUseCase` solo devuelve inicio/no-inicio; y el comando de
creación no contiene ni autoriza duración, ventanas ni disponibilidad. La matriz
existe como puerto, pero no basta. Por tanto no puede construirse un `VALID` sin
inventar duración, ventanas y jornada, contrario a EN-022.

Remediación mínima: exponer contratos públicos tenant-scoped de `customers` para
duración/ventanas planificables y de `journeys` para disponibilidad, y autorizar
la lectura de zona IANA desde `tenancy`; después cablearlos transaccionalmente en
`routing` junto con `TravelMatrix` para persistir `VALID` o `INCOMPLETE`/`FAILED`.
