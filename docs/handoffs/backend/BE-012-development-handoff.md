# BE-012 — Handoff de Desarrollo (evidencia CI final)

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD 8bfd410 + BE-012 territorios/autorización/auditoría/HTTP+cross-tenant-404`.

## Alcance y contratos

Se conserva el cierre de Seguridad: un `COMPANY_ADMIN` del tenant del vendedor que aporta un territorio existente de otro tenant recibe `404` genérico antes de escribir. Continúan `422` para territorios inexistentes/inactivos y el acceso exclusivo de `COMPANY_ADMIN`. No cambian OpenAPI, BE-062, migraciones ni contratos públicos.

Archivos de la remediación: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/application/SellerService.java`, `.../application/port/out/SellerStore.java`, `.../adapter/out/persistence/JdbcSellerStore.java`; pruebas `.../SellerTerritoryAssignmentControllerTest.java` y `.../SellerTerritoryAssignmentServiceTest.java`.

## Verificación final

- `mvn -q clean verify` desde `backend/followupbussiness` — PASS; ciclo completo con pruebas de integración, PostGIS/Testcontainers y migraciones.
- `git diff --check` — PASS; sólo avisos CRLF, sin errores de whitespace.

La cobertura preserva reemplazo de territorios, autorización por tenant, `404` cross-tenant sin reemplazos, auditoría ni efectos de filtro, y no-op/rechazos sin escritura. No hay puerto de eventos alcanzable, por lo que no se emite evento.

Riesgo residual: la comprobación cross-tenant queda acotada al tenant y devuelve sólo un booleano interno; HTTP conserva respuesta y detalle genéricos. Reproducción: `PUT /sellers/{sellerId}/territories` autenticado como admin, con UUID de territorio de otro tenant; esperar `404` y vendedor sin cambios.
