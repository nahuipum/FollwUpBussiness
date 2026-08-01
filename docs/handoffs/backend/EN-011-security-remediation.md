# EN-011 — Remediación de hallazgos de Seguridad por Desarrollo

## Naturaleza

Este documento registra la corrección y evidencia preparada por Desarrollo
Backend. No modifica ni reemplaza
`docs/handoffs/security/EN-011-security-review.md`, no declara `PASS` y queda
pendiente de retest independiente de Ciberseguridad.

## Hallazgos

| ID | Severidad | Estado de Desarrollo | Corrección |
|---|---|---|---|
| `SEC-EN011-001` | High | Corregido por Desarrollo; pendiente retest independiente | Override coordinado `postgresql.version=42.7.12`; política exige mínimo 42.7.12 y rechaza 42.7.11. |
| `SEC-EN011-002` | Medium | Corregido por Desarrollo; pendiente retest independiente | Override coordinado `jackson-bom.version=3.1.5`; política exige Databind mínimo 3.1.5 y rechaza 3.1.4. |

Spring Boot permanece en 4.1.0. No se fijaron versiones individuales
dispersas para los artefactos Jackson.

## Evidencia de resolución

- POM efectivo:
  `target/effective-pom-en011-remediated.xml`.
- Árbol final:
  - `org.postgresql:postgresql:42.7.12`, runtime;
  - `tools.jackson.core:jackson-databind:3.1.5`, compile/runtime.
- JAR:
  - `BOOT-INF/lib/postgresql-42.7.12.jar`;
  - `BOOT-INF/lib/jackson-databind-3.1.5.jar`.
- SBOM CycloneDX 1.6 con 58 componentes y ambas versiones corregidas.
- Verificación de coordenadas en POM efectivo, árbol de dependencias, JAR y
  SBOM: no están presentes `org.postgresql:postgresql:42.7.11` ni
  `tools.jackson.core:jackson-databind:3.1.4`.
- Búsqueda productiva: sin `JsonView`, `JsonUnwrapped` ni entrada controlada
  por cliente que conceda rol o tenant.

## Pruebas ejecutadas

Con Oracle JDK 21.0.9, Maven 3.9.6, Docker Desktop 27.4.0,
Testcontainers 2.0.5 y `postgis/postgis:17-3.5`:

| Validación | Resultado |
|---|---|
| `DependencySecurityPolicyTest` | 5 pruebas, `BUILD SUCCESS` |
| `BaseRoleCatalogMigrationTest` | 4 pruebas, 0 fallos/errores/omitidas |
| `SecurityConfigurationTest` | 28 pruebas, 0 fallos/errores/omitidas |
| `mvn clean verify` | 67 pruebas, `BUILD SUCCESS`, sin fallos/errores/omitidas |
| Arquitectura | 4 pruebas ArchUnit superadas |
| `git diff --check` | Código 0 |

La migración volvió a cubrir base limpia, doble seed, código arbitrario,
duplicado, scope y versión inválidos. No se añadieron endpoints, usuarios,
asignaciones, JWT, sesiones ni alcance funcional de BE-007.

## Artefactos

- JAR SHA-256:
  `192A20AAA243D0CD2BEEB4615C6D66E4862B4AAEF3E6F9CB58A8B0AED8779938`.
- SBOM SHA-256:
  `60C44EFF3AFBB6000C5BC9A225E31A991C3BCD20B91CF2043E2C047CA1374895`.
- Snapshot lógico de fuentes EN-011:
  `7E4EEA628877C2C98306207160D196D090DCB18CF3731B2FB57FF11DF8D55927`
  sobre 16 archivos.

El snapshot excluye este documento, los handoffs y el review independiente
para evitar autorreferencia. Se calcula ordenando rutas relativas y
concatenando líneas `<ruta><TAB><SHA-256><LF>` en UTF-8 antes del SHA-256
final.

## Riesgo residual

- Ciberseguridad debe verificar nuevamente POM efectivo, árbol, JAR y SBOM.
- Los overrides deben conservarse o elevarse al actualizar Spring Boot.
- El SBOM sigue siendo inventario y no sustituye una ejecución SCA.
- TLS productivo y channel binding se validarán cuando exista configuración de
  despliegue productivo.
- Las vistas Jackson nunca deben sustituir autorización de servidor.

## Estado

Remediación de Desarrollo: `READY_FOR_HANDOFF`.

`SEC-EN011-001` y `SEC-EN011-002`: corregidos por Desarrollo, pendientes de
retest independiente.

READY_FOR_HANDOFF
