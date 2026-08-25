# Development handoff — EN-020

## Estado

`READY_FOR_HANDOFF` — Candidate-ID `8a0c1903d65f6181536d64c0500130e97873a65c + f76a4db1052d`.

## Entrega

- `websocket-contract.md`: WebSocket nativo `tracking/v1`, destino único,
  envelope v1, matriz de autorización y pruebas A→B/B→A.
- `openapi.yaml`: ticket WebSocket de un uso, no-cacheable, bearer y fallback
  con `stale` servidor.
- ADR-002 aceptado; ADR-023 fija ticket/subprotocolo y expiración ligada al
  access JWT.

## Invariantes verificadas

Tenant, rol, equipo y recurso se derivan en servidor; no entran tenant ni
sellerId en suscripción. Denegación no publica ni entrega snapshot. El ticket
vence en `min(60 s, access.exp)` y la conexión se cierra/cancela en `access.exp`.
`stale` es `receivedAt + 5 min <= now`; Redis no define actualidad.

## Validación

`git diff --check` PASS. Cambio exclusivamente documental; no corresponde suite
runtime. Pendiente de QA, Seguridad y DoF independientes.
