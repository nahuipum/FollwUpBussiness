# Contrato WebSocket

## Canal lógico

`/company/{companyId}/tracking`

Conocer el identificador no autoriza la suscripción. El servidor valida empresa, rol y equipo.

## Mensajes

- `seller.location.updated`
- `seller.status.changed`
- `visit.status.changed`

Cada ubicación incluye `capturedAt`, `receivedAt`, precisión y flag `stale`.

## Reglas

- Heartbeat.
- Reconexión exponencial.
- Snapshot REST al reconectar.
- Mensajes antiguos no sustituyen estados recientes.
- No existe suscripción cruzada entre empresas.
