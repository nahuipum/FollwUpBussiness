# EN-022 — Handoff de documentación

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD+ff8fac1 EN022-docs-e8d11a6b3684`

- Decisiones aprobadas: máximo 50 puntos/52 nodos/2,652 pares distintos; PostgreSQL autoritativo; Matrix estático por lotes solo al capturar; borrador sin snapshot bloquea ETA/reordenamiento; retención 30 días y auditoría saneada 365 días.
- ADR-023 y la política de snapshot fijan fuentes server-side, tenant/rol/equipo, no revelación, ciclo de vida, revisión inmutable por `Route.version`, pares no enrutables y transacción con auditoría/outbox.
- OpenAPI reduce `CreateRouteRequest.customerIds` a 50 y tipa el `409` de reordenamiento.
- No se cambió runtime, migraciones ni pruebas. `git diff --check` pasó; no se ejecutaron suites por alcance documental.

Pendiente: QA independiente y Seguridad sobre el Candidate-ID exacto; BE-023/BE-064 siguen bloqueadas hasta sus `PASS` y DoF.
