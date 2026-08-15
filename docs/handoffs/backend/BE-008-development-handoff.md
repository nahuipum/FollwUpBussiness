# BE-008 — Handoff Development

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `HEAD c38dad7 + BE-008 rollback-audit-integration/pruebas`.

Remediación QA: se añadió `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/persistence/SellerCreationTransactionIntegrationTest.java`. Con PostgreSQL/Flyway, usa el `SellerService` proxificado, fuerza `audit.record=false` tras la invitación real y demuestra rollback de cuenta SELLER, perfil, relaciones, token de activación e invitación/notificación. No hubo correcciones de producción, contrato ni migración.

Se conservan tenant de sesión, autorización `COMPANY_ADMIN` y ausencia de secretos: la prueba solo consulta conteos, nunca valores de token ni PII.

Evidencia: `mvn -q "-Dtest=SellerCreationTransactionIntegrationTest" test` PASS; `mvn -q "-Dtest=SellerServiceTest,SellerCreationTransactionIntegrationTest,ModuleBoundaryTest" test` PASS; `mvn -q clean verify` PASS; `git diff --check` PASS.

Criterio cubierto: ante fallo de auditoría, no queda identidad parcial ni credencial/invitación utilizable. Riesgo residual: QA debe repetir su validación independiente de HTTP, aislamiento cross-tenant y concurrencia del candidato.
