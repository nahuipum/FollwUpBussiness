# ADR-005 — RabbitMQ para procesos asíncronos
**Estado:** Propuesto

RabbitMQ gestionará importaciones, notificaciones, reportes y proyecciones. Se usarán outbox, reintentos limitados, backoff, DLQ e idempotencia.
