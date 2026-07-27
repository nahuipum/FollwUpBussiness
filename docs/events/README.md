# Catálogo de eventos

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
