# BE-011 — Development handoff

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** `a361343 + BE-011/d2c022eeadfe`

## Alcance y evidencia

Se implementó `PUT /sellers/{sellerId}/supervisor` sin modificar OpenAPI. Sólo `COMPANY_ADMIN` de sesión puede operar; vendedor y supervisor se resuelven por tenant. Se valida supervisor `SUPERVISOR` activo; `null` retira la relación. La misma columna durable `workforce_seller.supervisor_id`, ya consumida por BE-059, produce de inmediato el alcance actual y revoca el supervisor previo. Reintentos iguales no escriben ni auditan; la actualización optimista evita efectos de concurrencia.

Archivos: `workforce/.../SellerController.java`, `SellerService.java`, `application/port/out/SellerStore.java`, `adapter/out/persistence/JdbcSellerStore.java`; correlación de auditoría en `audit/.../SecurityContextAuditTrustedContextProvider.java`. No hay migración ni cambio contractual. Puertos alcanzados: REST/autenticación, caso de uso, `SellerStore` (consulta/validación/actualización), consulta de equipo BE-059, auditoría y contexto de correlación.

Pruebas añadidas: `SellerSupervisorAssignmentServiceTest`, `SellerCreationTransactionIntegrationTest`, `SecurityContextAuditTrustedContextProviderTest`. Cubren asignación, retiro, reasignación, tenant/rol/estado, denegaciones sin efectos, reintento, conflicto y rollback si falla auditoría.

Comandos OK: `mvn -q -Dtest=SellerSupervisorAssignmentServiceTest,SellerCreationTransactionIntegrationTest,SecurityContextAuditTrustedContextProviderTest test`; `mvn -q clean verify` (165.9 s); `git diff --check`.

Riesgo residual: la autorización HTTP global permite solicitudes autenticadas y el rechazo fino se aplica en el caso de uso; QA debe reproducir 403 por rol y 422/404 del endpoint. Reproducción: `PUT /sellers/{sellerId}/supervisor` con `{ "supervisorId": "<uuid activo del tenant>" }` o `null`.
