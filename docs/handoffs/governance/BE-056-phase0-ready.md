# Ready — BE-056 Gestionar reintentos y DLQ

## Estado

`READY_FOR_HANDOFF`

## Historia, alcance y snapshot revisado

- Historia: `docs/stories/backend/BE-056-gestionar-reintentos-y-dlq.md`.
- Snapshot: `dca1a9c` sobre la rama `feature/first`; BE-055 ya tiene DoF `PASS` y
  su PR #2/CI trazables en `docs/handoffs/governance/BE-055-dof.md`.
- Alcance solicitado: política operable de retry/backoff/DLQ para mensajes
  fallidos, sin convertir RabbitMQ en fuente de verdad.

## Evidencia de dependencias y decisiones disponibles

| Elemento | Evidencia | Estado |
|---|---|---|
| EN-005 / RabbitMQ y PostgreSQL | Infraestructura ya usada por BE-055 y ADR-005 aceptado. | Disponible |
| Outbox, reintentos limitados y observabilidad base | `OutboxPublisher`, `JdbcOutboxStore`, migración `V3__create_transactional_outbox.sql`, alertas y DoF de BE-055. Máximo 8, backoff con jitter, `TERMINAL`, correlationId y métricas. | Disponible |
| DLQ y reproceso avanzado | ADR-019 aceptado define DLQ PostgreSQL para publicación no confirmada, clasificación de fallos, reproceso de plataforma limitado, retención y observabilidad; RabbitMQ DLQ queda por consumidor. | Estable |

## Resolución de la decisión de Ready

El usuario autorizó la decisión MVP documentada en ADR-019. El estado
`TERMINAL` pasará atómicamente a una DLQ durable PostgreSQL para fallos de
publicación; las DLQ nativas RabbitMQ se aplicarán posteriormente a cada
consumidor propietario.

Las decisiones que quedan cubiertas por ADR-019 son:

1. Topología DLQ aprobada por consumidor/routing key: exchange/colas, bindings,
   TTL o mecanismo de backoff, retención y quién las declara.
2. Clasificación estable de errores transitorios, permanentes e inciertos y la
   transición exacta hacia DLQ; hoy cualquier `RuntimeException` consume los
   ocho intentos.
3. Operación de reproceso: actor/rol autorizado, aislamiento por tenant,
   validación/auditoría, conservación de `eventId` y comportamiento ante replay.
4. Contrato de observabilidad y alertas para profundidad/edad de DLQ y fallo de
   su publicación, sin payload ni datos personales.

## Próxima fase autorizada

Desarrollo puede implementar la migración forward-only, transición atómica a
DLQ, reproceso de plataforma, métricas/alertas y pruebas dirigidas conforme
ADR-019. No se repetirá el análisis de BE-055.

## Archivos y módulos revisados

- `docs/architecture/adr/ADR-005-rabbitmq-asincronia.md`
- `docs/events/README.md`, `docs/events/event-catalog.yaml`
- `infrastructure/rabbitmq/topology.md`
- `backend/followupbussiness/.../outbox/application/OutboxPublisher.java`
- `backend/followupbussiness/.../outbox/adapter/out/persistence/JdbcOutboxStore.java`
- `docs/handoffs/governance/BE-055-dof.md`

## Criterio → evidencia

| Criterio BE-056 | Evidencia | Resultado |
|---|---|---|
| CA1: reintentos limitados | ADR-005 y `OutboxPublisher.MAX_ATTEMPTS = 8`. | Disponible por BE-055 |
| CA2: permanentes a DLQ | ADR-019 define DLQ PostgreSQL y la separación de DLQ RabbitMQ por consumidor. | Listo para implementar |
| CA3: correlationId | Envelope, headers y logs de BE-055 lo preservan. | Disponible por BE-055 |
| CA4: métrica/alerta | ADR-019 define profundidad, antigüedad, entradas y reprocesos de DLQ. | Listo para implementar |

## Comandos y resultados

- `python -m graphify query "What outbox retry and DLQ classes and tests exist in the backend?" --budget 700` — localizó el módulo outbox y sus pruebas.
- Revisión dirigida de ADR-005, historia BE-056, topología RabbitMQ, catálogo de
  eventos, reglas de seguridad/observabilidad y handoff DoF de BE-055.
- Decisión MVP autorizada por el usuario y formalizada en ADR-019; gate Ready
  reabierto para Desarrollo.
