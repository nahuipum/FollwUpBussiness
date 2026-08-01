# Backend Handoff — EN-011

> **Trazabilidad sustituida el 2026-07-30.** ADR-011 fue aceptado conforme a la
> opción A y se añadió el cierre CI/SCA. Los hashes y resultados históricos de
> este documento describen un snapshot anterior y no validan el candidato
> actual. La referencia vigente es
> `docs/handoffs/backend/EN-011-closure-remediation-handoff.md`; el workflow
> conserva 30 días la evidencia técnica allowlisted, y QA/Ciberseguridad deben
> repetirse sobre su manifiesto y el SHA ejecutado.

## Trazabilidad

- Historia:
  `docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md`.
- Requisitos: tipos de usuario 6.1–6.4, RF-AUT-003 y RNF-006.
- Dominio propietario: `identityaccess`.
- Responsable de este documento: Desarrollo Backend.
- Este handoff declara `READY_FOR_HANDOFF`; no constituye aprobación ni
  sustituye QA, Ciberseguridad o DoF.
- Remediación `SEC-EN011-001`: pgJDBC actualizado coordinadamente a 42.7.12.
- Remediación `SEC-EN011-002`: Jackson BOM actualizado coordinadamente a 3.1.5.
- Ambos hallazgos están corregidos por Desarrollo y pendientes de retest
  independiente; el review de Seguridad conserva su estado original.

## Alcance implementado

- Catálogo de dominio sin dependencias de Spring con exactamente:
  `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`.
- Ámbito `PLATFORM` para `PLATFORM_SUPERADMIN`.
- Ámbito `COMPANY` para `COMPANY_ADMIN`, `SUPERVISOR` y `SELLER`.
- Códigos literales, estables, únicos y resolubles solo por coincidencia exacta.
- Persistencia global en PostgreSQL mediante Flyway.
- Migración versionada para la tabla y migración repetible con seed idempotente.
- Restricciones de base para códigos, ámbitos, correspondencia código/ámbito,
  versión del catálogo y unicidad.
- Configuración de datasource sin credenciales predeterminadas ni versionadas.
- Rutas hipotéticas de creación, modificación o elevación de roles cubiertas
  por la política `deny by default` de EN-010.
- Documentación de requisitos locales, evolución, pruebas y rollback.

## Fuera de alcance

No se implementaron usuarios, creación o modificación de usuarios, asignación
de roles, roles personalizados, permisos granulares, autorización por recurso,
equipos, login, sesiones, JWT, refresh token, endpoints, eventos ni contratos
OpenAPI. Tampoco se implementó alcance de EN-012, BE-057, BE-003 o BE-007.

## ADR

`docs/architecture/adr/ADR-011-catalogo-roles-base.md` está `Aceptado` desde
2026-07-30 por decisión explícita del Product Owner en la orquestación,
conforme a la opción A, y documenta:

- PostgreSQL y Flyway como persistencia e inicialización;
- códigos estables y ámbitos de plataforma/empresa;
- catálogo global sin `tenant_id`, separado de futuras asignaciones
  multiempresa;
- ownership exclusivo del servidor;
- ausencia de superficie CRUD o autoridad suministrada por clientes;
- evolución hacia EN-012, BE-057, BE-003 y BE-007;
- alternativas, riesgos y reversión forward-only después del despliegue.

## Datos y migraciones

### V1 — estructura

`V1__create_identity_access_role_catalog.sql` crea
`identity_access_role_catalog`:

| Columna | Tipo | Regla |
|---|---|---|
| `code` | `VARCHAR(64)` | PK y lista cerrada de cuatro códigos |
| `scope` | `VARCHAR(16)` | `PLATFORM` o `COMPANY` |
| `catalog_version` | `SMALLINT` | Debe ser `1` |

Una restricción adicional fija la correspondencia entre código y ámbito.

### R — referencia repetible

`R__seed_identity_access_base_roles.sql` carga los cuatro registros mediante
`INSERT ... ON CONFLICT DO UPDATE`. Ejecutarlo repetidamente converge al
catálogo aprobado sin duplicar filas.

La tabla no usa `tenant_id` porque almacena referencias globales inmutables,
no usuarios ni asignaciones empresariales. Las relaciones futuras deberán
incluir y validar el tenant autenticado.

## Seguridad y aislamiento multiempresa

- Ningún rol llega desde body, query, header o endpoint.
- EN-011 no crea rutas públicas ni mecanismos de elevación.
- Los paths hipotéticos `POST /roles`, `PUT /roles/SELLER` y
  `PATCH /roles/PLATFORM_SUPERADMIN` responden `401` sin autenticación.
- PostgreSQL rechaza códigos arbitrarios, duplicados y ámbitos incompatibles.
- La prueba de integración usa una contraseña sentinela y confirma que no
  aparece en logs capturados.
- `application.yaml` referencia `POSTGRES_PASSWORD` sin valor predeterminado.
- No hay datos personales, sesiones, tokens ni información tenant en el
  catálogo.

## Dependencias

Todas las versiones son administradas por Spring Boot 4.1.0:

| Dependencia | Versión efectiva | Alcance | Justificación |
|---|---:|---|---|
| `spring-boot-starter-jdbc` | 4.1.0 | Producción | Datasource transaccional PostgreSQL |
| `spring-boot-starter-flyway` | 4.1.0 | Producción | Migraciones al arrancar |
| `flyway-database-postgresql` | 12.4.0 | Runtime | Soporte PostgreSQL requerido por Flyway |
| `postgresql` | 42.7.12 | Runtime | Driver JDBC PostgreSQL corregido |
| `jackson-databind` | 3.1.5 | Compile/runtime | BOM Jackson coordinado y corregido |
| `testcontainers-postgresql` | 2.0.5 | Test | Base PostGIS desechable y reproducible |

No se añadió JPA ni se expusieron entidades de persistencia.

## Archivos creados y modificados

### Creados

- `docs/architecture/adr/ADR-011-catalogo-roles-base.md`
- `docs/handoffs/backend/EN-011-backend-handoff.md`
- `docs/handoffs/backend/EN-011-security-remediation.md`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/BaseRole.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/RoleScope.java`
- `backend/followupbussiness/src/main/resources/db/migration/V1__create_identity_access_role_catalog.sql`
- `backend/followupbussiness/src/main/resources/db/migration/R__seed_identity_access_base_roles.sql`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/domain/model/BaseRoleTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/BaseRoleCatalogMigrationTest.java`

### Modificados

- `backend/followupbussiness/pom.xml`
- `backend/followupbussiness/README.md`
- `backend/followupbussiness/src/main/resources/application.yaml`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/FollowupbussinessApplicationTests.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfigurationTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/DependencySecurityPolicyTest.java`

No se modificaron OpenAPI, eventos, WebSocket, sincronización, frontend,
mobile, contratos funcionales, backlog ni otras historias.

El cambio concurrente preexistente en `.vscode/settings.json` se preservó y no
forma parte de EN-011.

## Pruebas agregadas

- `BaseRoleTest`: catálogo exacto, códigos únicos/estables y rechazo de códigos
  desconocidos o con casing distinto.
- `BaseRoleCatalogMigrationTest` sobre `postgis/postgis:17-3.5`:
  - migración desde base limpia;
  - igualdad entre catálogo Java y filas PostgreSQL;
  - segunda ejecución Flyway sin migraciones pendientes;
  - ejecución directa repetida del seed sin duplicados;
  - rechazo de código arbitrario, duplicado y scope inválido;
  - validación Flyway;
  - contraseña sentinela ausente en logs.
- `SecurityConfigurationTest`: tres operaciones hipotéticas de mutación de
  roles permanecen protegidas.
- `DependencySecurityPolicyTest`: pgJDBC mínimo 42.7.12, Jackson Databind
  mínimo 3.1.5 y rechazo explícito de 42.7.11/3.1.4.
- ArchUnit: dominio libre de Spring/infraestructura y límites modulares.

## Comandos y evidencia reproducible

Todos los comandos Maven se ejecutaron desde `backend/followupbussiness` con
JDK 21.0.9.

### Compilación

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn -DskipTests compile
```

Resultado: `BUILD SUCCESS`; 64 fuentes de producción compiladas.

### Dominio y rutas

```powershell
mvn "-Dtest=BaseRoleTest,SecurityConfigurationTest" test
```

Resultado: `BUILD SUCCESS`; 31 pruebas, 0 fallos, 0 errores y 0 omitidas.

### Migración PostgreSQL/PostGIS

```powershell
mvn "-Dtest=BaseRoleCatalogMigrationTest" test
```

Resultado:

- Testcontainers 2.0.5 conectado a Docker 27.4.0;
- imagen `postgis/postgis:17-3.5`;
- PostgreSQL 17.5;
- V1 y R aplicadas correctamente desde esquema vacío;
- 4 pruebas, 0 fallos, 0 errores y 0 omitidas;
- segunda migración: esquema actualizado, ninguna migración pendiente.

### Suite completa

```powershell
mvn clean verify
```

Resultado:

- `BUILD SUCCESS`;
- 67 pruebas;
- 0 fallos;
- 0 errores;
- 0 omitidas;
- 4 validaciones ArchUnit;
- JAR ejecutable generado;
- SBOM CycloneDX 1.6 generado y validado con 58 componentes.

### Dependencias efectivas

```powershell
mvn dependency:tree "-Dincludes=org.springframework.boot:spring-boot-starter-jdbc,org.springframework.boot:spring-boot-starter-flyway,org.flywaydb:*,org.postgresql:postgresql,org.testcontainers:testcontainers-postgresql"
```

Resultado: versiones efectivas 4.1.0, Flyway 12.4.0, PostgreSQL JDBC 42.7.12,
Jackson Databind 3.1.5 y Testcontainers 2.0.5. Los overrides se realizan con
`postgresql.version` y `jackson-bom.version`, no con versiones individuales
dispersas.

### Remediación de cadena de suministro

```powershell
mvn "-Dtest=DependencySecurityPolicyTest" test
mvn help:effective-pom "-Doutput=target/effective-pom-en011-remediated.xml"
mvn dependency:tree "-Dverbose" "-Dincludes=org.postgresql:postgresql,tools.jackson.core:*"
jar tf target/followupbussiness-0.0.1-SNAPSHOT.jar
```

Resultado:

- `DependencySecurityPolicyTest`: 5 pruebas, `BUILD SUCCESS`;
- POM efectivo: pgJDBC 42.7.12 y Jackson BOM/Databind 3.1.5;
- árbol: pgJDBC 42.7.12 runtime y Databind 3.1.5 compile por rutas WebMVC y
  Flyway coordinadas;
- JAR: `postgresql-42.7.12.jar` y `jackson-databind-3.1.5.jar`;
- SBOM CycloneDX 1.6: ambas versiones corregidas;
- las coordenadas vulnerables `org.postgresql:postgresql:42.7.11` y
  `tools.jackson.core:jackson-databind:3.1.4` no aparecen en el POM efectivo,
  árbol de dependencias, JAR ni SBOM.

Hashes de artefactos remediados:

- JAR:
  `192A20AAA243D0CD2BEEB4615C6D66E4862B4AAEF3E6F9CB58A8B0AED8779938`;
- SBOM:
  `60C44EFF3AFBB6000C5BC9A225E31A991C3BCD20B91CF2043E2C047CA1374895`.
- snapshot lógico de 16 fuentes EN-011:
  `7E4EEA628877C2C98306207160D196D090DCB18CF3731B2FB57FF11DF8D55927`.

La búsqueda productiva no encontró `JsonView`, `JsonUnwrapped` ni entradas
cliente que otorguen autoridad de rol o tenant.

### Revisión Git y superficie

```powershell
git diff --check
git ls-files --others --exclude-standard
rg -n "@(RestController|Controller)|RequestMapping|PostMapping|PutMapping|PatchMapping" src/main/java/com/nahui/followupbussiness/identityaccess
rg -n "jakarta\.persistence|org\.springframework|org\.flywaydb" src/main/java/com/nahui/followupbussiness/identityaccess/domain/model
```

Resultado:

- `git diff --check` finalizó con código `0`;
- todos los archivos nuevos EN-011 aparecen como no ignorados por Git;
- no existe controlador o mapping de roles en producción;
- el modelo de dominio no importa Spring, JPA ni Flyway.

SHA-256 de migraciones:

- V1:
  `B4A4B4994DC96B0FA8627DB45A6007C75AB21FD9639F09019F078EC9731911B5`;
- R:
  `32317CB81456F593CCF785D82F4282BFBF42FE31FB2627B11CE26BFBB7DDEB87`.

No existe evidencia CI para EN-011; toda la evidencia anterior es local y
reproducible.

## Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| El catálogo contiene exactamente los roles base definidos por el contrato funcional. | Enum cerrado y seed de cuatro filas con checks SQL. | `BaseRoleTest`, migración limpia y consulta PostgreSQL. | Implementado |
| Los códigos son estables, únicos y documentados. | Códigos literales, PK, checks, ADR y README. | Pruebas de dominio y constraints. | Implementado |
| El catálogo puede crearse en una base limpia de forma repetible. | Flyway V1 + R idempotente. | Testcontainers/PostGIS, segunda migración y doble seed. | Implementado |
| No existe endpoint público para crear o elevar roles arbitrariamente. | No se añadió controlador; deny-by-default permanece. | Tres rutas negativas en `SecurityConfigurationTest`. | Implementado |
| La tarea cuenta con pruebas y evidencia reproducible. | Suite unitaria, integración, seguridad, arquitectura y política de dependencias. | `mvn clean verify`: 67 pruebas. | Implementado |

## Riesgos residuales y dependencias posteriores

- Los códigos se convierten en contrato persistente; cambios futuros requieren
  nueva migración y revisión de compatibilidad.
- Las asignaciones futuras deberán añadir tenant, autorización por recurso y
  auditoría; el catálogo global no resuelve esos controles.
- EN-012 debe controlar el bootstrap de `PLATFORM_SUPERADMIN`.
- BE-057 debe limitar la provisión a `COMPANY_ADMIN`.
- BE-003 debe obtener roles desde el servidor y definir la sesión en su ADR.
- BE-007 debe implementar asignación y permisos, sin convertir este catálogo
  en CRUD público.
- La suite de migración requiere Docker disponible.
- Los overrides de pgJDBC y Jackson deben conservarse o elevarse al actualizar
  Spring Boot; una degradación vuelve a abrir `SEC-EN011-001/002`.
- QA, Ciberseguridad y DoF permanecen pendientes.

## Rollback

Antes de despliegue, retirar tipos, dependencias, configuración, migraciones,
pruebas y documentación EN-011. Después de aplicar V1, no editar ni borrar la
migración: crear una nueva migración forward que verifique ausencia de
referencias usuario-rol y luego elimine la tabla. Si incrementos posteriores
ya dependen del catálogo, revertirlos coordinadamente primero.

## Instrucciones de reproducción

1. Configurar JDK 21.
2. Mantener Docker Desktop disponible.
3. Desde `backend/followupbussiness`, ejecutar `mvn clean verify`.
4. Para arranque local, copiar `.env.example` a `.env`, reemplazar los
   placeholders, exportar sus variables y ejecutar
   `docker compose up -d postgres` desde la raíz.
5. Ejecutar `mvn spring-boot:run`; Flyway aplicará V1 y R antes de aceptar
   tráfico.

## Recomendación para QA

Repetir la suite en una máquina con Docker, inspeccionar las cuatro filas y
constraints en PostgreSQL, intentar inserciones inválidas y confirmar que no
existe mapping HTTP de roles. Revisar además que ninguna futura asignación
confunda el catálogo global con ownership tenant.

## Estado

Estado de Desarrollo Backend: `READY_FOR_HANDOFF`.

QA, Ciberseguridad y DoF deben revisar esta entrega de forma independiente.
Este documento no declara `PASS`.

READY_FOR_HANDOFF
