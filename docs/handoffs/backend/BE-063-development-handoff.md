# Handoff Desarrollo — BE-063

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `71a31cc + 68a518fe` (digest conjunto BE-063/FE-043; `68a518fe` corresponde a la composición FE-043, sin cambio de código ni evidencia backend).

Alcance backend: endpoint `POST /company/users/{userId}/invitation`, uso transaccional de corrección/reenvío de invitación y pruebas en [CompanyUserController.java](../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/CompanyUserController.java), [CompanyUserService.java](../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/CompanyUserService.java), [LoginConfiguration.java](../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/LoginConfiguration.java) y pruebas asociadas. Sin migración nueva; reutiliza los puertos BE-006 de token/notificación, auditoría y outbox.

Cubre: sólo `COMPANY_ADMIN`/tenant de sesión; recurso fuera de tenant no revelado; sólo `INVITED`; `If-Match` vigente; identidad conservada y unicidad tenant-scoped autoexcluyente; reenvío sin cambios reemplaza activación; datos, token, solicitud de notificación, auditoría y outbox quedan en la misma transacción. Respuesta `202` no expone token, enlace ni credenciales.

Evidencia: `mvn -q -Dtest=CompanyUserServiceTest,CompanyUserControllerTest,CompanyUserPostgresIntegrationTest test` PASS; `mvn -q -Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test` PASS; `git diff --check` PASS. `mvn -q clean verify` falló por infraestructura ajena: arranque del contenedor `postgis/postgis:17-3.5` en `RefreshSessionTransactionIntegrationTest` (0 fallos de aserción; 1 error de contenedor).

Riesgo/reproducción: QA debe repetir `POST` como admin del tenant con `If-Match: "<version>"`, y verificar token previo invalidado, outbox/auditoría y rechazo cross-tenant, estado no `INVITED` y versión obsoleta.
