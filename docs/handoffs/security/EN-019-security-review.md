# Security review — EN-019

## Estado

`PASS`

## Superficie revisada

- Tabla PostgreSQL `tenancy_company`, estado de acceso y migración V4.
- Puerto interno `CompanyAccessStatusQuery` y adaptador JDBC.
- Límite entre `tenancy` e `identityaccess`.

## Evidencia

- UUID tipado y SQL parametrizado: sin vía de inyección.
- Empresa suspendida e inexistente devuelven el mismo `false`; no se filtra el
  estado ni datos de empresa.
- Una falla de PostgreSQL no autoriza: propaga error y nunca retorna `true`.
- `tenancy` conserva tabla/adaptador; consumidores reciben solo el contrato
  booleano. No hay HTTP, secretos, cache, mensajería, logs ni PII nuevos.
- Retest independiente JDK 21/Testcontainers/PostgreSQL 17.5:
  `CompanyAccessStatusMigrationTest` PASS (1/1), Flyway hasta V4.
- `git diff --check`: PASS. SAST/SCA/DAST: `NOT_EXECUTED`, no aplicables al
  diff sin nueva superficie externa.

## Riesgo residual

La migración V4 debe preceder a la futura migración de BE-056, que se
renumerará a V5 antes de publicarse. La integración runtime en BE-003 y la
revocación al suspender una empresa pertenecen a sus historias respectivas.
