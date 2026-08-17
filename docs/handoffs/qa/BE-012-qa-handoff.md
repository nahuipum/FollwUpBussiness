# BE-012 — Handoff QA Backend (revalidación)

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 8bfd410 + BE-012 territorios/autorización/auditoría/HTTP+cross-tenant-404`.

## Mapeo y evidencia

- `PUT /sellers/{sellerId}/territories`: `SellerController` y `SellerValidationErrorHandler` mantienen el contrato declarado; `SellerTerritoryAssignmentControllerTest` cubre `200`, `400`, `403`, `404` y `422`.
- Cuerpo inválido: el advice convierte `MethodArgumentNotValidException` y JSON ilegible a `400` con `X-Correlation-Id` y `correlationId`; la prueba verifica cuerpo ausente/vacío y `verifyNoInteractions(service)`.
- Autorización/tenant y efectos: MockMvc cubre no autenticado, `SUPERVISOR` y `SELLER` con `403`; `SellerTerritoryAssignmentServiceTest` cubre rol, tenant cruzado, duplicado, inactivo y conflicto, conservando territorios, cero escrituras y cero auditorías.

## Comandos y resultado

- `mvn -q '-Dtest=SellerTerritoryAssignmentControllerTest,SellerTerritoryAssignmentServiceTest' test` — PASS.
- `git diff --check` — PASS. `git status --porcelain` coincide con el diff candidato; no hay cambios de OpenAPI/contrato ni migraciones.

## Hallazgos y riesgos

No se reproducen hallazgos. Riesgo residual: no se ejecutó CI completo en esta revalidación; se reutiliza el `clean verify` PASS del mismo Candidate-ID indicado por Desarrollo.
