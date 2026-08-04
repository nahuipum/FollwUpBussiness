# Topología inicial

| Routing key | Cola |
|---|---|
| customer.import.requested | customer-import-worker |
| route.published | mobile-notification-worker |
| seller.location.updated | tracking-projection-worker |
| visit.* | reporting-visit-worker |
| sale.* | reporting-sales-worker |

Cada cola crítica tendrá una DLQ nativa de RabbitMQ cuando se implemente su
consumidor propietario. Conforme ADR-019, los fallos de publicación que no
alcanzan confirmación del broker se conservan primero en la DLQ durable de
PostgreSQL; no se los declara como mensajes RabbitMQ.
