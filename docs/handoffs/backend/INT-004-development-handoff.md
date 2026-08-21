# INT-004 — Handoff Development Backend

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `d2f2a26 + INT-004:c584aaebb2c3`.

## Alcance

- Corregida `INT-004-BE-01`: el alta audita `status=INVITED`, consistente con el perfil y la cuenta persistidos.
- Añadida integración PostgreSQL/Testcontainers `alta → activación → login MOBILE`.
- Remediada la evidencia de inactivación: revoca sesión y tokens de acción, y el siguiente login `MOBILE` es rechazado. Se actualizaron los dobles de estado para devolver un `User` válido.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/application/SellerService.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/persistence/SellerCreationTransactionIntegrationTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/application/SellerStatusServiceTest.java`

No hay migraciones ni cambios de contrato.

## Evidencia

- `mvn -q "-Dtest=SellerStatusServiceTest,SellerCreationTransactionIntegrationTest" test` — PASS.
- `git diff --check` — PASS.

La integración verifica: alta `INVITED`, rol `SELLER`, tenant derivado y auditoría `INVITED`; activación transiciona cuenta y vendedor a `ACTIVE`; login `MOBILE` crea sesión en el mismo tenant. Tras la inactivación por el mismo flujo, comprueba que la familia de sesión y tokens de acción quedan revocados y que un nuevo login `MOBILE` falla. La prueba de servicio conserva las denegaciones y el conflicto concurrente con dobles válidos.

Riesgo residual: no se ejecutó la suite completa; la remediación es solo de pruebas y no modifica producción, contratos ni migraciones.

Reproducción: ejecutar el comando Maven indicado desde `backend/followupbussiness` con Docker disponible.
