# Context package — EN-020

## Estado

`PASS` — contrato, QA Backend/Frontend, Seguridad y DoF documentales cerrados.

**Candidate-ID:** `8a0c1903d65f6181536d64c0500130e97873a65c + f76a4db1052d`
(delta contractual EN-020).

## Alcance

Contrato WebSocket versionado y aislamiento multiempresa para tracking en vivo;
sin implementación de servidor, clientes, REST, Redis, mensajería ni E2E.

## Predecesoras verificadas

- `EN-010`, `EN-011`, `EN-013` y `EN-016`: evidencia de cierre/contrato estable
  localizada; `EN-016` tiene DoF `PASS`.
- `ADR-006`: `Aceptado`.
- `ADR-002`: `Aceptado` por Luis Siancas — Owner, 2026-08-25; estrategia de
  aislamiento multiempresa estable.

## Decisiones cerradas

1. ADR-002: aprobada sin cambios; tenant derivado de sesión y segregación
   obligatoria.
2. `stale`: decisión MVP del Owner delegada el 2026-08-25: servidor calcula
   `receivedAt + 5 min <= now`; el fallback REST muestra ese estado y no lo
   reemplaza por el TTL de Redis.
3. Perfil WS: WebSocket nativo JSON, ticket opaco de un uso/60 s emitido con
   access JWT vigente; ruta y destino sin tenant seleccionable.

## Fuentes revisadas

EN-020; ADR-002, ADR-006 y ADR-016; EN-016 y su DoF; contrato WebSocket actual;
readiness y dependencias; historias BE-029/030/031, FE-020 e INT-011.

## Siguiente condición

Implementación posterior solo después de conservar este DoF `PASS`; los
controles runtime quedan en BE-031, FE-020 e INT-011.
