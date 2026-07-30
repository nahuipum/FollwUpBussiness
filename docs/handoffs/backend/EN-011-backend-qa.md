# QA Backend — EN-011

## Ambiente y versión

- Fecha de retest: 2026-07-28 (America/Lima).
- Repositorio/directorio: `C:\Users\LUIS\OneDrive\Escritorio\FollowUpBussiness\FollwUpBussiness`.
- Rama: `feature/first...origin/feature/first`; HEAD: `34d13469731f0b89177ce5c594389b6b99a06f52`.
- Worktree sin commit: alcance EN-011 y remediación incluyen POM, prueba de política de dependencias, modelo, Flyway, pruebas, README, ADR y handoffs. `.vscode/settings.json` es preexistente y ajeno; se preservó.
- Ambiente ejecutado: Oracle JDK 21.0.9, Maven 3.9.6, Spring Boot 4.1.0, Docker Desktop 27.4.0, Testcontainers 2.0.5, `postgis/postgis:17-3.5` / PostgreSQL 17.5.
- Handoff QA actualizado: `docs/handoffs/backend/EN-011-backend-qa.md`.

Fuentes releídas: `AGENTS.MD`, `backend/followupbussiness/AGENTS.MD`, `agents/qa/04_backend_qa.md`, `shared/TEAM_WORKFLOW.md`, EN-011, ADR-011, migraciones/código/pruebas afectados, handoff de Desarrollo actualizado, este handoff, revisión de Seguridad y la remediación de Desarrollo `docs/handoffs/backend/EN-011-security-remediation.md`. No existe un handoff DoF específico de EN-011; solo están las instrucciones/checklist generales.

## Datos y comandos ejecutados

| Comando o inspección | Resultado verificable |
|---|---|
| `git status --short`, `git diff --name-status`, inspección de POM y `DependencySecurityPolicyTest` | Los únicos cambios de remediación funcional son los overrides coordinados `postgresql.version=42.7.12`, `jackson-bom.version=3.1.5` y sus cinco pruebas de política. |
| `mvn clean verify` con JDK 21 | PASS: 67 pruebas, 0 fallos, 0 errores, 0 omitidas; JAR y SBOM CycloneDX con 58 componentes generados. |
| `mvn "-Dtest=DependencySecurityPolicyTest,BaseRoleCatalogMigrationTest,BaseRoleTest,SecurityConfigurationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test` con JDK 21 | PASS: 44 pruebas, 0 fallos, 0 errores, 0 omitidas. Incluye política de dependencias, migración, deny-by-default y ArchUnit. |
| `mvn help:effective-pom -Doutput=target/effective-pom-en011-qa-retest.xml` | POM efectivo contiene `postgresql.version=42.7.12` y `jackson-bom.version=3.1.5`. Las apariciones de `3.1.4` en plugins Maven son versiones de `maven-install/deploy-plugin`, no coordenadas Jackson. |
| `mvn dependency:tree -Dverbose -Dincludes=org.postgresql:postgresql,tools.jackson.core:*` | Runtime resuelto: `org.postgresql:postgresql:42.7.12`; `tools.jackson.core:jackson-databind:3.1.5` y `jackson-core:3.1.5`. |
| `jar tf target/followupbussiness-0.0.1-SNAPSHOT.jar` y lectura del SBOM | JAR contiene `postgresql-42.7.12.jar` y `jackson-databind-3.1.5.jar`; no contiene 42.7.11 ni 3.1.4. SBOM contiene exclusivamente esas coordenadas corregidas. |
| Búsqueda estática de mappings, sesión/JWT/usuarios, `@JsonView`/`@JsonUnwrapped`, permisos públicos e imports prohibidos | Sin controlador/mapping de roles, usuarios, JWT, sesión, asignación, permisos por recurso, `permitAll`, `@JsonView` ni `@JsonUnwrapped` en producción; el dominio sigue sin dependencias de infraestructura. |
| `git diff --check` final | PASS; sin errores de whitespace. |

El árbol Maven intentado dentro del sandbox fue bloqueado por la red; se repitió fuera del sandbox y finalizó con `BUILD SUCCESS`. No se leyó ningún `.env` ni secreto real.

### Observaciones de Seguridad retesteadas

| ID | Severidad original | Estado QA | Evidencia independiente |
|---|---|---|---|
| `SEC-EN011-001` | High | RESUELTA técnicamente; pendiente retest formal de Ciberseguridad. | Política runtime PASS; POM efectivo, árbol, JAR y SBOM muestran pgJDBC 42.7.12; 42.7.11 no está en el artefacto ni el SBOM. |
| `SEC-EN011-002` | Medium | RESUELTA técnicamente; pendiente retest formal de Ciberseguridad. | Política runtime PASS; BOM/árbol/JAR/SBOM muestran Jackson Databind 3.1.5; 3.1.4 no está en el artefacto ni el SBOM. No hay `@JsonView`/`@JsonUnwrapped` productivos. |

## Matriz criterio → prueba → evidencia

| Criterio | Implementación | Prueba | Evidencia | Resultado |
|---|---|---|---|---|
| 1. Base limpia crea exactamente `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`. | `BaseRole`, V1 y seed R enumeran los cuatro códigos con ámbitos PLATFORM/COMPANY. | `BaseRoleTest`; `BaseRoleCatalogMigrationTest.cleanDatabaseContainsExactlyTheDomainCatalog`. | PostgreSQL 17.5 efímero recibe V1+R y retorna cuatro filas exactas. | PASS |
| 2. Códigos únicos, estables y coincidentes con contrato. | Enum literal, PK y checks de código/ámbito/correspondencia/versión; README y ADR-011. | `BaseRoleTest`; restricciones SQL de migración. | PostgreSQL rechaza código arbitrario, duplicado y scope incompatible; pruebas PASS. | PASS |
| 3. Estrategia repetible e idempotente. | Flyway V1 y seed repetible R con `ON CONFLICT`. | `BaseRoleCatalogMigrationTest`. | V1+R se validan y aplican desde esquema vacío; seed converge al catálogo aprobado. | PASS |
| 4. Segunda ejecución no duplica ni altera códigos. | Seed condicionado por `code`; catálogo cerrado por constraints. | `flywayAndSeedExecutionAreRepeatableWithoutDuplicates`. | Segunda migración: `migrationsExecuted=0`; doble seed: cuatro filas, sin duplicados. | PASS |
| 5. Sin endpoint/comando/flujo no autenticado de CRUD o elevación. | Sin adaptador REST/controlador de roles; SecurityFilterChain deny-by-default. | `SecurityConfigurationTest`; búsqueda de mappings productivos. | `POST /roles`, `PUT /roles/SELLER` y `PATCH /roles/PLATFORM_SUPERADMIN` devuelven 401 sin autenticación; no hay mapping productivo. | PASS |
| 6. Sin usuarios, login, sesiones, JWT, asignación ni permisos por recurso. | EN-011 añade solo catálogo; aplicación excluye `UserDetailsService` por defecto. | `applicationDoesNotCreateDefaultUsers`; búsqueda estática. | Sin `UserDetailsService` activo, JWT, `HttpSession`, asignaciones o permisos de recurso en producción. | PASS |
| 7. Límites hexagonales/modulares de `identityaccess`. | `BaseRole` y `RoleScope` en `identityaccess/domain/model`, sin infraestructura. | `HexagonalArchitectureTest`; `ModuleBoundaryTest`; búsqueda de imports. | Cuatro pruebas ArchUnit PASS; sin Spring/JPA/Hibernate/Flyway/adaptadores en dominio. | PASS |
| 8. Sin secretos/tokens/datos sensibles en logs, respuestas, migraciones o fixtures. | Configuración solo referencia password sin default; migraciones contienen códigos; errores son mínimos. | Prueba de log de contraseña, `SecurityConfigurationTest`, `RepositorySecretsPolicyTest`. | Contraseña sentinela no aparece en output; 401/403 sin stack, password, authorization ni secret; política de secretos PASS. | PASS |
| 9. Pruebas de desarrollo, migración y arquitectura aplicables. | Unitarias, seguridad, integración Testcontainers, ArchUnit y política de dependencias. | Suite focalizada y `mvn clean verify`. | 44 focalizadas y 67 totales, todas PASS; migración limpia, segunda ejecución, deny-by-default, secretos y arquitectura cubiertos. | PASS |
| 10. Documentación/ADR de roles plataforma/empresa. | ADR-011, README y handoff de Desarrollo. | Inspección documental contra tipos 6.1–6.4 y EN-011. | ADR-011 asocia `PLATFORM_SUPERADMIN` a PLATFORM y los otros tres a COMPANY; explica catálogo global y futuras asignaciones tenant-bound. | PASS |

## Migraciones e idempotencia

- V1 crea `identity_access_role_catalog` con PK y checks de código, ámbito, correspondencia y versión; no se modificó una migración preexistente.
- R inserta/converge los cuatro roles con `INSERT ... ON CONFLICT`; la integración real desde base limpia y su segunda ejecución pasaron.
- Se rechazaron datos fuera del catálogo, duplicados y scopes incompatibles. No existe usuario ni asignación de rol que requiera test de concurrencia.
- PostGIS geográfico, índices espaciales, Redis, RabbitMQ y WebSocket: NOT_APPLICABLE en EN-011.

## Seguridad y aislamiento

- `SEC-EN011-001` y `SEC-EN011-002` no se reprodujeron en el runtime actual: las versiones vulnerables fueron sustituidas de manera coordinada, no mediante pins aislados de Databind.
- La política de dependencias rechaza explícitamente 42.7.11 y 3.1.4, por lo que una degradación del classpath falla pruebas.
- No hay ruta para que body, query o header otorguen rol, tenant o permiso; no hay CRUD ni elevación de roles.
- El catálogo es global y no lleva `tenant_id` porque no representa datos empresariales ni asignaciones. ADR-011 exige que historias futuras deriven tenant de la identidad autenticada.
- Reingreso obligatorio a Ciberseguridad: retestar `SEC-EN011-001/002` contra el mismo snapshot, confirmar POM efectivo/árbol/JAR/SBOM sin 42.7.11 ni 3.1.4, revisar que los overrides se mantengan coordinados y emitir un nuevo estado de Seguridad. Este PASS de QA no sustituye ese retest formal.

## Regresión y arquitectura

- `mvn clean verify`: PASS, 67 pruebas; JAR y SBOM generados.
- Suite focalizada: PASS, 44 pruebas, incluidas cinco de política de dependencias, cuatro de migración y cuatro ArchUnit.
- Arquitectura hexagonal y límites modulares: PASS. El catálogo permanece en el dominio y sin comunicación interna entre dominios.
- OpenAPI, eventos, WebSocket y sync: NOT_APPLICABLE y sin modificaciones para EN-011.

## Defectos reproducibles

| ID | Severidad | Descripción | Reproducción | Recomendación |
|---|---|---|---|---|
| — | — | No hay defectos técnicos abiertos reproducidos por QA en el snapshot retesteado. | — | Ciberseguridad debe emitir el retest formal de los dos hallazgos previos. |

## Riesgos residuales

- ADR-011 sigue `Propuesto`; gobernanza debe resolverlo antes de que historias dependientes consuman el catálogo.
- RF-AUT-003 y RNF-006 no están completos funcionalmente: EN-012, BE-057, BE-003 y BE-007 deberán incorporar identidad, tenant, autorización por recurso y auditoría.
- Se requiere JDK 21 y Docker para repetir la integración; ambos se usaron con éxito.
- El SBOM es inventario, no reemplaza SCA. La validación de TLS/channel binding productivo corresponde al entorno de despliegue futuro.
- Advertencias no bloqueantes: carga dinámica de Mockito y keywords de validación SBOM; sin fallo de pruebas ni evidencia de impacto funcional en EN-011.

## Estado

PASS
