# Paquete de contexto — BE-024

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `538b07a + 005b1cc458c4`

## Alcance

`POST /routes/{routeId}/publish` para `COMPANY_ADMIN` y `SUPERVISOR`, con
tenant y equipo derivados de sesión, `If-Match`, idempotencia, auditoría y
outbox transaccional de `route.published` v1. Quedan fuera Mobile, push y
entrega de notificaciones.

## Invariantes preparados

- Éxito: una ruta `DRAFT`, autorizada, con vendedor activo y snapshot `VALID`
  de su versión pasa a `PUBLISHED`, incrementa versión y persiste auditoría y
  outbox en la misma transacción.
- Denegación/rechazo/conflicto: no hay cambio, evento ni auditoría de éxito
  para alcance inválido, estado no publicable, vendedor inactivo, snapshot
  inválido, `If-Match` obsoleto o idempotencia incompatible.
- Observabilidad: solo IDs técnicos y `correlationId`; sin PII, coordenadas,
  tokens ni payload completo.

## Decisiones verificadas

- BE-023 establece `DRAFT` como único estado editable.
- EN-022 exige un `PlanningSnapshot` `VALID` ligado a la `Route.version` para
  publicar.
- `route.published` v1 está registrado para `routing`; su envelope contiene
  únicamente los campos técnicos autorizados y se guarda en outbox con la
  transición.

## Decisión MVP aprobada por Orquestación

`notifySeller=false` no suprime `route.published`, no altera sus destinatarios
técnicos ni afecta publicación, versión, auditoría, autorización o Mobile.
Siempre se encola el evento para que Mobile reciba la transición. El campo se
propaga como booleano técnico opcional del envelope: BE-053 deberá omitir solo
el push cuando sea `false`; seguirá validando tenant, destinatario e
instalación. Su ausencia equivale a `true` por compatibilidad v1.

El booleano no contiene PII, ubicación, secretos ni contenido visible; es una
adición opcional compatible con `route-notification/v1`.
