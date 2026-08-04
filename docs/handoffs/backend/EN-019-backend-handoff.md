# EN-019 — Backend handoff

## Estado

`READY_FOR_HANDOFF`

## Alcance

- Fuente de verdad PostgreSQL `tenancy_company` con UUID, estado y timestamps.
- Contrato público mínimo `CompanyAccessStatusQuery#isActive(UUID)`.
- Adaptador JDBC que no expone datos de empresa y devuelve `false` para empresa
  inexistente o suspendida.
- Sin endpoint, onboarding, configuración comercial ni acceso de
  `identityaccess` a tablas de `tenancy`.

## Archivos y migración

- `V4__create_tenancy_company_access_status.sql` (BE-056 se renumerará a V5 antes de su publicación).
- Módulo `tenancy`: dominio, puerto, adaptador JDBC y configuración.
- `CompanyAccessStatusMigrationTest`.

## Criterio → evidencia

| Criterio | Evidencia |
|---|---|
| Fuente de verdad durable | Flyway/Testcontainers crea `tenancy_company`. |
| Activa/suspendida/inexistente | Prueba JDBC cubre los tres resultados. |
| Límite modular | Puerto público; `ModuleBoundaryTest` PASS. |
| Dominio puro | `HexagonalArchitectureTest` PASS. |

## Comandos

`mvnw.cmd -Dmaven.repo.local=C:\\tmp\\followupbussiness-en019-m2 -Dtest=CompanyAccessStatusMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest test` con JDK 21: **PASS**, 5 pruebas.

`git diff --check`: **PASS**. `python -m graphify update .`: **PASS**.
