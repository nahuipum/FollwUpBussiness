# BE-012 — Revisión final de Ciberseguridad

**Estado:** `PASS`  
**Candidate-ID:** `HEAD 8bfd410 + BE-012 territorios/autorización/auditoría/HTTP+cross-tenant-404`

## Superficie revisada

`PUT /sellers/{sellerId}/territories`: autorización, aislamiento `tenantId`, BOLA/IDOR, persistencia, auditoría, filtros y respuestas HTTP.

## Abuso y controles

**PASS:** un `COMPANY_ADMIN` con vendedor local y territorio cross-tenant recibe `404` con detalle genérico, indistinguible de un recurso inaccesible. La resolución ocurre antes de reemplazar relaciones o auditar. La prueba focalizada confirma cero escrituras de relación, auditorías y lecturas de filtros. No existen puertos de evento o caché alcanzables en este flujo, por lo que no queda estado retenido.

**PASS:** `SUPERVISOR` recibe `403` genérico; la validación de rol falla antes de acceder a persistencia o auditoría.

**NOT_EXECUTED:** la reproducción Maven local fue bloqueada por `AccessDeniedException` sobre `C:\.m2\repository`. Se reutilizaron los reportes Surefire focalizados: ambas suites con 3 pruebas, 0 fallos y 0 errores.

## Hallazgos y riesgos residuales

Sin hallazgos de seguridad abiertos. No aplican secretos, ubicación, archivos, WebSocket, Redis/caché, mensajería, dependencias ni infraestructura. La auditoría usa UUID y no incorpora PII.
