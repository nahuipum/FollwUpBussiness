# EN-023 — Guard transaccional de inicio de jornada

**Área:** Backend / Arquitectura  
**Tipo:** Enabler técnico  
**Prioridad:** Must Have  
**Fase:** MVP

## Objetivo

Materializar en PostgreSQL el guard compartido que permite consultar, bajo el
mismo lock transaccional de BE-028, si un vendedor ya inició su jornada en una
fecha operativa. Desbloquea el control previo de BE-064 sin crear una jornada.

## Alcance

- La llave es exactamente `(tenant_id, seller_id, business_date)`; la lectura
  crea el guard ausente y lo bloquea con `FOR UPDATE` hasta terminar la
  transacción invocadora.
- `JourneyStartedStatusUseCase` devuelve `NOT_STARTED` mientras BE-028 no haya
  escrito `started_at`; devuelve `STARTED` después, incluso si la jornada se
  cierra. Un fallo de persistencia es `Unavailable`, nunca `NOT_STARTED`.
- BE-028 adquiere este mismo guard y marca `started_at` en su misma transacción
  de inicio. No hay endpoint REST, ubicación, tracking, evento
  `journey.started` ni inicio artificial.

## Criterios de aceptación

1. La migración forward-only crea un guard PostgreSQL tenant-scoped y único.
2. La consulta del puerto se limita a la terna exacta y conserva el lock de la
   transacción llamadora; tenant A no afecta tenant B.
3. Dos transacciones concurrentes para la misma terna se serializan; BE-028
   puede reutilizar el mismo guard para registrar el inicio.
4. El módulo mantiene puertos hexagonales, configuración explícita y dominio
   libre de framework.

## Fuera de alcance

- Implementar BE-028, transporte REST, tracking, Mobile, auditoría, eventos o
  inferir el inicio a partir de rutas, visitas u hora.

<!-- delivery-traceability:start -->
## Secuencia de entrega y trazabilidad

- **Predecesoras obligatorias:** `EN-016` — Definir privacidad, retención y rastreo.
- **Historias consecuentes que habilita:** `BE-028` — Iniciar jornada; `BE-064` — Editar ruta publicada antes de iniciar jornada.
- **Validación vertical:** prueba JDBC con PostgreSQL para aislamiento tenant y lock concurrente.
<!-- delivery-traceability:end -->
