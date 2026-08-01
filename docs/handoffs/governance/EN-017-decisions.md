# Decisiones humanas — EN-017

## Estado

`APROBADAS_PARA_DESARROLLO_DOCUMENTAL`

## Responsable y confirmaciones

- **Responsable:** Luis Siancas — Owner.
- **Fecha:** 2026-07-31 (America/Lima).
- **Confirmaciones:** Producto, Arquitectura/DevOps y Seguridad, emitidas por
  el responsable indicado.

## Decisiones MVP

| Decisión | Opción | Decisión aprobada |
|---|---|---|
| D1 identidad | A | Email transaccional mediante puerto y un proveedor configurado por ambiente; token/enlace de un uso y respuesta neutral. |
| D2 push de rutas | A | FCM para Flutter, con pasarela a APNs en iOS, encapsulados por adaptador. |
| D3 pantalla bloqueada | A | Título y cuerpo genéricos; sin datos de negocio ni identificadores. |
| D4 dispositivo | A | Registro autenticado ligado a instalación, usuario, tenant y plataforma; upsert/rotación y revocación inmediata en los eventos definidos. |
| D5 entrega | A | Outbox/evento `route.*`, deduplicación por evento+destinatario+tipo, backoff+jitter limitados, DLQ y TTL push de 24 h; Mobile refresca desde backend. |
| D6 fallback | A | Email transaccional para identidad; push best-effort para rutas y sincronización al abrir/reconectar, sin fallback email/SMS de rutas. |
| D7 operación | A | Un proveedor transaccional por ambiente, sandbox separado, cuotas, alertas y secretos gestionados. |
| D8 auditoría | A | Tipo, resultado, intento, proveedor, latencia, correlationId e IDs técnicos protegidos; sin token ni contenido. |

## Límites

Estas decisiones habilitan únicamente ADR y contratos de EN-017. No autorizan
implementar BE-006, BE-053, FE-002, MOB-029, SDK, endpoint, productor,
consumidor ni proveedor concreto. Cualquier elección nominal de proveedor,
protocolo o persistencia adicional requiere su ADR y aprobación correspondiente.
