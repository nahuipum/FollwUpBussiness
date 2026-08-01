# EN-019 — Backend QA

## Estado

`PASS`

## Alcance validado

Árbol de trabajo de `feature/en-019-tenancy-company-foundation` (PR #5), retestado tras la renumeración `V5` → `V4`.

| Criterio | Implementación revisada | Prueba/evidencia | Resultado |
|---|---|---|---|
| PostgreSQL es fuente de verdad durable | `V4__create_tenancy_company_access_status.sql`: tabla `tenancy_company`, UUID, estado, timestamps y restricción de estado | `CompanyAccessStatusMigrationTest` limpia y migra una base PostgreSQL 17.5 real por Testcontainers | PASS |
| Consulta distingue activa, suspendida e inexistente | `JdbcCompanyAccessStatusQuery#isActive(UUID)` filtra por `id` y `ACTIVE`, sin retornar entidad ni campos de empresa | Misma prueba inserta ACTIVE y SUSPENDED y consulta un UUID inexistente | PASS |
| Contrato público sin acceso a tabla/repositorio de otro módulo | `CompanyAccessStatusQuery` es el único contrato público añadido; la búsqueda de `identityaccess` no muestra acceso a `tenancy_company` ni a adaptadores de tenancy | `ModuleBoundaryTest` PASS; inspección de imports y referencias | PASS |
| Dominio sin Spring/JPA/infraestructura | `CompanyStatus` no tiene dependencias de infraestructura; wiring y JDBC quedan fuera del dominio | `HexagonalArchitectureTest` PASS | PASS |

## Comandos y evidencia

- Ejecución inicial (antes de renumerar): `C:\\WorkSpace\\apache-maven-3.9.6\\bin\\mvn.cmd -Dmaven.repo.local=C:\\tmp\\fieldsales-en019-m2 -Dtest=CompanyAccessStatusMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest test` con JDK 21: PASS, 5 pruebas, 0 fallos.
- Retest: `git -c safe.directory=C:/tmp/field-sales-en019 show --format= --check 579e8e8`, `git -c safe.directory=C:/tmp/field-sales-en019 diff --check 579e8e8^ 579e8e8` y `git -c safe.directory=C:/tmp/field-sales-en019 diff --check cf461a9 579e8e8`: PASS, sin salida. El whitespace que motivó el hallazgo previo quedó resuelto.
- `git -c safe.directory=C:/tmp/field-sales-en019 diff --name-only cf461a9 579e8e8`: solo cambia la historia para el formato y se incorpora este handoff; no hay cambio de producción, migración ni prueba que invalide la ejecución dirigida anterior.
- La consulta de referencias de `CompanyAccessStatusQuery` y `tenancy_company` solo devuelve el módulo `tenancy`; no se detectó exposición de datos ni dependencia de `identityaccess` a la tabla/adaptador.
- Retest final de la renumeración: la fixture limpia contiene únicamente `V1`, `V2`, `V3`, `V4` y la repetible; no queda `V5`. El mismo comando Maven con JDK 21: PASS, 5 pruebas, 0 fallos; Flyway validó cinco migraciones (incluida la repetible) y migró una PostgreSQL 17.5 limpia hasta versión `v4`. `git diff --check`: PASS, sin salida (las advertencias LF/CRLF de Git no son errores de whitespace).

## Hallazgos

- Ninguno abierto. El hallazgo bajo de formato del commit `cf461a9` fue corregido y verificado en `579e8e8`.

## Regresión y riesgos residuales

- Regresión dirigida de arquitectura, wiring compilado y migración/consulta: PASS.
- No aplicable: endpoint, autorización HTTP, `tenantId` recibido del cliente, idempotencia, Redis, mensajería y WebSocket están fuera del alcance de EN-019.
- Riesgo de liberación a coordinar: BE-056 debe conservar la renumeración acordada a V5 antes de su publicación, para mantener la secuencia Flyway posterior a la V4 de EN-019.
