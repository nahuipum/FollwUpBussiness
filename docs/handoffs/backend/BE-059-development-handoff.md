# BE-059 — Development handoff

Estado: `READY_FOR_HANDOFF`  
Candidate-ID: `HEAD 59bc372 + BE-059 seller-read 9abcd2d`

## Alcance

Implementados `GET /sellers` y `GET /sellers/{sellerId}` sin alterar el contrato ni operaciones BE-009..012. El adaptador REST entrega paginación contractual y `X-Correlation-Id`/`correlationId` en respuestas controladas. La respuesta mantiene separado `userId`, perfil vendedor y estado; no incluye credenciales, tokens ni secretos.

## Cambios y puertos

- `workforce/application/SellerService.java`: autorización tenant-first; admin por tenant, supervisor limitado a equipo vigente, seller solo detalle propio; `SELLER` no lista y platform/no autorizados se deniegan antes de leer.
- `workforce/application/port/out/SellerStore.java` y `adapter/out/persistence/JdbcSellerStore.java`: lectura, filtro por tenant/equipo/status/supervisor/territorio/búsqueda, orden estable `display_name,id`, conteo consistente y territorios en lote.
- `adapter/in/rest/SellerController.java`: parámetros `page`, `pageSize`, filtros y códigos `200/400/403/404`.
- Pruebas: `SellerQueryServiceTest.java`; actualización compatible de `SellerServiceTest.java`.

Puertos alcanzables: `SellerStore.find/list/count`; no se alcanza `insert`, invitación, auditoría, outbox ni migraciones.

## Evidencia

`mvn -q '-Dtest=SellerServiceTest,SellerQueryServiceTest' test` — PASS.  
`git diff --check` — PASS.

Cubre éxito admin/supervisor/seller propio, aislamiento cross-tenant/equipo, filtro supervisor manipulado sin enumeración y denegaciones sin llamadas a puertos de lectura. Riesgo residual: falta QA HTTP/persistencia PostgreSQL para conversiones de parámetros y semántica SQL; reproducir con los dos GET autenticados y tenants/equipos distintos.
