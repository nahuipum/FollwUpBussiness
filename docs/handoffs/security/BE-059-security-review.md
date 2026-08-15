# BE-059 — Revisión de Ciberseguridad

Estado: `PASS`  
Candidate-ID: `HEAD 59bc372 + BE-059 seller-read 9abcd2d`.

## Superficie y abuso

Revisados `GET /sellers` y `GET /sellers/{sellerId}`: autorización por rol, BOLA/IDOR, aislamiento `tenantId`/equipo, filtros/conteo/paginación, PII y efectos de rechazo.

`PASS` — `mvn -q '-Dtest=SellerQueryServiceTest#scopesAdminSupervisorAndSellerWithoutLeakingOtherTenantOrTeam' test`. Con vendedores de otro tenant y otro equipo, `SUPERVISOR` solo lista su equipo; `supervisorId` ajeno devuelve página vacía; `SELLER` y supervisor no obtienen detalle ajeno; un ID cross-tenant resulta ausente.

El diff confirma que `tenantId` procede de `AuthenticatedActor`; lista y conteo aplican tenant/equipo antes de filtros, orden y paginación. Los rechazos solo alcanzan lectura o se detienen antes: no hay escrituras, eventos ni auditoría. La respuesta contiene PII contractual autorizada, sin credenciales, tokens, secretos ni logging añadido.

## Hallazgos y cierre

Ninguno reproducible. Cierre observable: aislamiento y ausencia de efectos prohibidos confirmados para este Candidate-ID. WebSocket, caché/Redis, mensajería, archivos, dependencias e infraestructura no aplican.

Riesgo residual: Seguridad no ejecutó binding HTTP/SQL PostgreSQL real de combinaciones; reutiliza QA focalizada `PASS`. Suite completa QA no ejecutada por timeout, sin fallo funcional.
