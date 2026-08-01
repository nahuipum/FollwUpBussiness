# ADR-005 — RabbitMQ para procesos asíncronos
**Estado:** Aceptado
**Responsable:** Luis Siancas — Owner
**Fecha:** 2026-08-01 (America/Lima)

## Decisión

RabbitMQ transporta procesos asíncronos; PostgreSQL conserva la fuente de verdad.
Cada transición de negocio y su fila de outbox se confirman en la misma
transacción. El publicador reclama filas de forma concurrente segura, publica
con `eventId` estable y actualiza después el resultado: la garantía es al menos
una vez, nunca exactly once.

Estados: `PENDING → CLAIMED → PUBLISHED | RETRY_SCHEDULED | TERMINAL`. El
reclamo usa bloqueo que omite filas reclamadas y lease vencible; una fila no
confirmada se recupera sin perder `eventId`. Los errores transitorios tienen un
máximo de ocho intentos, backoff exponencial con jitter; un resultado incierto
preserva la redelivery. BE-055 marca `TERMINAL`, registra diagnóstico saneado y
alerta; BE-056 posee el reproceso y operación avanzada de DLQ.

Las filas `PUBLISHED` y `TERMINAL` se retienen 30 días como evidencia técnica.
Se alertan backlog sostenido, antigüedad de la fila pendiente más antigua,
fallos de publicación y filas terminales. Logs y métricas contienen IDs
técnicos, correlationId, resultado y tipo de error; nunca payload completo,
secretos ni PII.

El envelope versionado usa `eventId`, `eventType`, `version`, `occurredAt`,
`tenantId`, `correlationId`, `causationId` y payload controlado. BE-055 no crea
eventos de negocio: cada dominio registra los suyos en el catálogo antes de
producirlos.
