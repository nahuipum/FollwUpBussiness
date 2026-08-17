# BE-011 — QA independiente

**Estado:** PASS  
**Candidate-ID:** `a361343 + BE-011/d2c022eeadfe`

## Mapeo y evidencia

- Admin same-tenant asigna, reasigna y retira con `null` → `SellerService`/`JdbcSellerStore` (actualización por tenant, versión y relación previa) → `SellerSupervisorAssignmentServiceTest` → relación vigente, dos auditorías y reintento sin escritura/auditoría.
- Supervisor activo con rol válido; vendedor inexistente/cross-tenant, rol/estado inválido, supervisor/seller/anónimo y concurrencia se rechazan sin efectos → `admin`, `find(tenant, ...)`, `activeSupervisor` y actualización optimista → prueba de servicio → `Forbidden`/`NotFound`/`Invalid`/`Conflict`, cero escrituras y auditorías; el controlador traduce a 403/404/422.
- Auditoría, correlationId y rollback → proveedor de contexto, transacción y prueba de integración → se conserva `supervisor_id` y versión cuando falla auditoría; correlationId de solicitud se propaga.
- Acceso inmediato del equipo → misma `supervisor_id` durable consumida por la consulta existente de BE-059; no hay caché/grant añadido.

## Comandos

`mvn -q '-Dtest=SellerSupervisorAssignmentServiceTest,SellerCreationTransactionIntegrationTest,SecurityContextAuditTrustedContextProviderTest' test` — OK.  
`git diff --check` — OK.

## Hallazgos y riesgos

Sin hallazgos reproducibles. Riesgo residual bajo: no se añadió prueba MockMvc específica del nuevo endpoint; la traducción HTTP se verificó por inspección y la denegación/ausencia de efectos por prueba de servicio.
