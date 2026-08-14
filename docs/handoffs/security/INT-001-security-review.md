# INT-001 — Revisión de Seguridad

- **Estado:** `PASS`
- **Candidate-ID:** `e01c35c+0061cef1e255`
- **Superficie:** detalle de empresa de plataforma y corrección del onboarding.

La revisión confirmó que `GET /platform/companies/{companyId}` acepta únicamente `PLATFORM_SUPERADMIN` sin `tenantId`; principal nulo, otro rol o superadministrador ligado a tenant reciben `403` antes de consultar persistencia. La consulta JDBC usa un parámetro `UUID`, evitando concatenación SQL y selección fuera del identificador solicitado. Un recurso inexistente devuelve `404` solo tras autorización, mientras QA confirmó `401` anónimo.

Se reprodujo `GetCompanyServiceTest#tenantBoundPlatformActorIsDeniedBeforeTheStoreIsRead` con resultado PASS; el doble de persistencia demuestra que no se alcanza el store. El diff no incorpora secretos, tokens, datos sensibles ni logging nuevo. No cambiaron WebSocket, caché, mensajería, archivos, dependencias o infraestructura.

No hay hallazgos. Riesgo residual aceptado: un superadministrador global autorizado puede consultar los datos y la configuración de cualquier empresa, conforme al alcance del endpoint.
