# BE-009 — Revisión de Seguridad

Estado: `PASS`  
Candidate-ID: `HEAD eaa8cf5 + BE-009 PATCH seller update, tenant/ETag/audit/advisory-lock`.

## Superficie revisada

`PATCH /sellers/{sellerId}`: autorización `COMPANY_ADMIN`, aislamiento por `tenantId`, BOLA/IDOR, `If-Match` y concurrencia, validación de campos, PII, auditoría y `correlationId`. Se revisaron el paquete, QA `PASS`, diff de producción y `SellerUpdateServiceTest`; el candidato coincide con `eaa8cf5`.

## Hallazgos y evidencia

- Sin hallazgos Critical/High/Medium/Low. `SellerService.admin` rechaza todo rol distinto de `COMPANY_ADMIN`; la búsqueda y el `UPDATE` usan el tenant derivado de sesión, y el SQL condiciona por tenant, id y versión.
- Abuso reproducido — `PASS`: `mvn -q '-Dtest=SellerUpdateServiceTest#rejectsCrossTenantNonAdminStaleAndDuplicateWithoutWritesOrAudits' test`. Un `SUPERVISOR` y un `COMPANY_ADMIN` de otro tenant, con id e `If-Match` válidos, reciben denegación/no-encontrado; contadores observables: cero escrituras y cero auditorías. La misma prueba confirma rechazo de versión obsoleta y duplicado sin efectos parciales.
- Auditoría — `PASS`: se emite solo después de una escritura exitosa, con metadato técnico `PROFILE_UPDATED`, sin nombre, email, teléfono ni código; no se agregaron logs ni secretos. El contexto confiable aporta tenant, actor y correlación.

## No aplicables y riesgo residual

No cambiaron autenticación, sesiones, secretos, WebSocket, caché/Redis, mensajería, archivos, dependencias ni infraestructura. `NOT_EXECUTED`: concurrencia real entre dos transacciones PostgreSQL; permanece el riesgo residual ya aceptado por QA, mitigado por bloqueo asesor transaccional y actualización optimista por versión.
