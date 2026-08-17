# BE-011 — Revisión final de Seguridad

**Estado:** PASS  
**Candidate-ID:** `a361343 + BE-011/d2c022eeadfe`

## Superficie revisada

Autorización del `PUT /sellers/{sellerId}/supervisor`, aislamiento por `tenantId`, BOLA/IDOR sobre vendedor y supervisor, validación de rol/estado, actualización optimista, auditoría transaccional y revocación inmediata en `GET /sellers`.

## Hallazgos y evidencia

Sin hallazgos explotables.

- **PASS — Elevación de privilegios/BOLA:** `SellerService.admin(actor)` limita la mutación a `COMPANY_ADMIN`; vendedor y supervisor se consultan con el tenant de sesión. `JdbcSellerStore` valida supervisor por `company_id`, rol y estado, y actualiza por `tenant_id`, vendedor, versión y supervisor previo. El controlador traduce `Forbidden` a 403 y `NotFound` a 404.
- **PASS — Reproducción de abuso:** `SellerSupervisorAssignmentServiceTest#rejectsUnauthorizedCrossTenantInvalidAndConcurrentRequestsWithoutEffects` terminó OK. Reproduce admin cross-tenant y supervisor intentando asignar, con cero escrituras y cero auditorías; condición observable cumplida.
- **PASS — Revocación:** reasignación persiste directamente `supervisor_id`; la consulta del equipo filtra ese mismo campo por tenant y `actor.accountId()`. No se añadió caché/grant, por lo que el supervisor previo pierde alcance en la siguiente lectura. QA del mismo candidato cubrió reasignar/retirar, concurrencia y rollback.

## Controles no aplicables y riesgo residual

Sin cambios en secretos, archivos, ubicación/PII nueva, WebSocket, Redis/caché, mensajería, dependencias o infraestructura. Riesgo residual bajo: no existe prueba MockMvc específica; el abuso HTTP real quedó **NOT_EXECUTED**, aunque la ruta, propagación del principal y respuesta 403 se verificaron por inspección y la frontera de servicio fue ejecutada.
