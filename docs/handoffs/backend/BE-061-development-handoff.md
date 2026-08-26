# BE-061 — Development handoff

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `eddddca+98a900eb8d8b`

## Alcance

- Implementados `GET /routes`, `GET /routes/{routeId}` y `GET /routes/my-route` mediante `ReadRoutesUseCase`/`ReadRoutesService`.
- Administración/supervisión resuelve tenant, rol y equipo antes de filtros, conteos o puntos; vendedor solo obtiene su ruta `PUBLISHED` asociada a su cuenta. Fuera de alcance, sin ruta o vendedor inactivo responde `404` neutro; dos rutas vigentes devuelven `409` neutro.
- Sin escrituras, auditoría ni eventos en las consultas. La carga de puntos sigue a la autorización mediante proyección de cabecera.

## Archivos y contrato/migración

- Puertos/servicio: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/application/{ReadRoutesService.java,port/in/ReadRoutesUseCase.java}`; persistencia y REST en `.../routing/adapter/**`.
- Se amplía la referencia pública de workforce para resolver vendedores activos de cuenta/tenant, sin cruzar repositorios de dominio.
- `backend/followupbussiness/src/main/resources/db/migration/V50__enforce_one_published_route_per_seller_day.sql`: índice parcial único tenant+vendedor+fecha para `PUBLISHED`; publicación/reasignación traducen su violación a `409`.
- `docs/api/openapi.yaml`: `GET /routes/my-route` documenta `409` por asignación ambigua.

## Verificación

- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=JdbcRouteStoreIdempotencyIntegrationTest,ReadRoutesServiceTest,PublishRouteServiceTest,ReassignRouteServiceTest' test` — PASS.
- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' clean verify` — PASS.
- Cubierto: filtro fuera de equipo sin consultas, detalle vendedor autorizado tras cabecera, ambigüedad `409`, y restricción PostgreSQL/`409` de publicación. `git diff --check` — PASS.

## Riesgo y reproducción

La restricción única parcial impedirá aplicar `V50` si producción ya contiene dos rutas `PUBLISHED` para la misma clave; no se modificaron datos heredados. Corregir administrativamente esos duplicados antes de migrar. Reproducción: crear dos `DRAFT` para el mismo tenant/vendedor/fecha, publicar la primera y publicar o reasignar la segunda: devuelve `409` y no emite efectos posteriores.

## Remediación SEC-BE061-01

- `ReadRoutesService.get` ya no hace cabecera autorizada seguida de un detalle independiente. `RouteStore.findAuthorized` obtiene ruta y puntos mediante una sola consulta SQL filtrada por tenant, vendedores autorizados y `PUBLISHED` para vendedor; administración/supervisión usa su conjunto de equipo en la misma consulta.
- `ReadRoutesServiceTest.sellerReturnsNeutralNotFoundWhenRouteChangesAfterPreviouslyAuthorizedHeader` simula cabecera A previamente válida y detalle ya reasignado: exige `404` y verifica que no se carga detalle/puntos por una segunda lectura.
- `mvn -q '-Dmaven.repo.local=C:\Users\LUIS\.m2\repository' '-Dtest=ReadRoutesServiceTest' test` — PASS; `git diff --check` — PASS. No se ejecutó `clean verify`: no cambió configuración, migración ni composición; el `clean verify` previo cubre el resto del candidato base.

**Consulta excepcional:** se abrió `docs/stories/backend/BE-061-consultar-rutas-y-ruta-del-dia.md` y las secciones `/routes` de OpenAPI porque el paquete no especificaba filtros/paginación/esquemas del listado.

**Sincronización de candidato:** el digest canónico vigente de `git diff | git hash-object --stdin` es `98a900eb8d8b` tras SEC-BE061-01; el `clean verify` previo corresponde al candidato base y la prueba focalizada cubre el delta.
