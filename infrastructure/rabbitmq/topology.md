# Topología inicial

| Routing key | Cola |
|---|---|
| customer.import.requested | customer-import-worker |
| route.published | mobile-notification-worker |
| seller.location.updated | tracking-projection-worker |
| visit.* | reporting-visit-worker |
| sale.* | reporting-sales-worker |

Cada cola crítica tendrá DLQ.
