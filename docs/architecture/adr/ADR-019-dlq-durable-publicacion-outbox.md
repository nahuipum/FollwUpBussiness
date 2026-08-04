# ADR-019 — DLQ durable para fallos de publicación de outbox

**Estado:** Aceptado
**Aprobado por:** Usuario — decisión MVP para BE-056
**Fecha:** 2026-08-01

## Contexto

ADR-005 define outbox transaccional y entrega al menos una vez. Cuando el
publicador no recibe confirmación de RabbitMQ, no es posible afirmar que el
broker haya aceptado el mensaje; por tanto, moverlo exclusivamente a una cola
RabbitMQ podría perder la única evidencia durable del evento.

BE-056 requiere retry limitado, DLQ, correlación y alertas sin convertir el
broker en fuente de verdad.

## Decisión

Para fallos de **publicación de outbox** se usa una DLQ durable en PostgreSQL:

1. Los errores transitorios e inciertos reintentan como máximo ocho veces con
   backoff exponencial y jitter, preservando `eventId`.
2. Los errores permanentes (envelope/payload inválido o publicación no enrutable)
   y los transitorios agotados se mueven atómicamente desde `transactional_outbox`
   a `transactional_outbox_dlq`, dejando la fila original `TERMINAL`.
3. La DLQ conserva envelope controlado, `tenantId`, `correlationId`,
   `causationId`, contador de intentos, causa saneada, fecha y metadatos de
   reproceso. No se registra ni expone payload completo en logs o métricas.
4. Solo `PLATFORM_SUPERADMIN` puede solicitar el reproceso por `eventId`; el
   tenant se obtiene de la fila durable, nunca del cliente. El reproceso deja
   identidad técnica y fecha del operador, conserva `eventId` y está limitado a
   tres acciones explícitas por evento durante su retención. No existe
   reproceso automático ni bucle infinito.
5. Se miden y alertan profundidad y antigüedad de DLQ, entradas a DLQ y
   reprocesos. Las filas de outbox/DLQ se retienen 30 días conforme ADR-005.

RabbitMQ mantiene DLQ nativa por cola de **consumidor**. Su topología, el
rechazo/nack y sus reintentos se implementarán con cada consumidor propietario;
no se usa esa DLQ para suplir una publicación de outbox no confirmada.

## Consecuencias

- PostgreSQL sigue siendo la fuente de verdad y el paso a DLQ es atómico.
- El publicador conserva semántica al menos una vez: un timeout puede acabar en
  duplicado y los consumidores deduplican por `eventId`.
- El endpoint operativo es interno, protegido por rol y no recibe `tenantId`,
  payload, correlationId ni identidad de operador desde el cliente.
- Cambiar el límite, rol, persistencia, retención o estrategia de DLQ requiere
  ADR sucesor y revisión de Seguridad.

## Alternativas descartadas

- Usar únicamente RabbitMQ DLX para fallos del publicador: no hay garantía de
  que el mensaje alcance el broker tras un resultado incierto.
- Reintentos infinitos: degrada el servicio y oculta mensajes venenosos.
- Reproceso abierto por tenant o por cola: requeriría contratos de consumidores
  aún inexistentes y ampliaría la superficie multiempresa.

## Reversión

Deshabilitar el endpoint y el scheduler preserva outbox y DLQ para disposición
controlada. No se eliminan filas ni se reintenta automáticamente durante una
reversión.
