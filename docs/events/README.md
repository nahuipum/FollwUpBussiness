# Catálogo de eventos

**Estado actual:** `ACEPTADO_PARA_ENVELOPE_Y_OUTBOX`. La tabla describe eventos previstos,
pero cada evento debe incorporarse a `event-catalog.yaml` con versión, owner,
payload, productores, consumidores e idempotencia antes de ser contrato.

## Envelope común

```json
{
  "eventId": "uuid",
  "eventType": "visit.started",
  "version": 1,
  "occurredAt": "date-time",
  "tenantId": "uuid",
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": {}
}
```

`correlationId` es el UUID v4 canónico definido en
[`../api/correlation-id-contract.md`](../api/correlation-id-contract.md). El
productor conserva el ID efectivo de la operación que originó el evento; un
consumidor conserva el mismo valor en su log y, si publica un evento derivado,
lo reutiliza y fija `causationId` al `eventId` consumido. Reintentos y DLQ no
lo sustituyen. `tenantId` se valida de forma independiente y el ID nunca es
identidad, autorización, selector de tenant ni clave de idempotencia.

## Eventos iniciales

| Evento | Productor | Consumidores |
|---|---|---|
| company.created | tenancy | audit |
| seller.created | workforce | audit |
| customer.import.requested | imports | import-worker |
| customer.import.completed | imports | notifications, audit |
| route.published | routing | notifications, mobile-sync |
| route.reassigned | routing | notifications, audit |
| journey.started | journeys | tracking, reporting |
| seller.location.updated | tracking | websocket, reporting |
| visit.started | visits | routing, reporting, audit |
| visit.completed | visits | routing, reporting, audit |
| sale.created | sales | reporting, audit |
| sale.cancelled | sales | reporting, audit |
| journey.closed | journeys | tracking, reporting |

Todos los eventos son versionados y los consumidores son idempotentes.

## Fallos de publicación y DLQ

ADR-019 define la DLQ durable PostgreSQL para fallos del publicador de outbox:
preserva el envelope y sus IDs técnicos sin exponer payload en telemetría. Las
DLQ RabbitMQ de consumidores pertenecen a cada cola/consumidor y no alteran el
contrato del envelope.
