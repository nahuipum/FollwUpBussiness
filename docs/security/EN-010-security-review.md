# EN-010 — Snapshot de remediación de Seguridad

## Naturaleza

Este documento registra evidencia preparada por Desarrollo Backend para la
revisión independiente de Ciberseguridad. No constituye aprobación, no declara
`PASS` y no sustituye el dictamen del agente de Ciberseguridad.

## Alcance revisado

- validación segura del secreto local obligatorio;
- dependencias Tomcat efectivas bajo Spring Boot 4.1.0;
- empaquetado de la aplicación;
- inventario CycloneDX reproducible.

## Hallazgos

| ID | Estado de Desarrollo | Corrección | Evidencia |
|---|---|---|---|
| `SEC-EN010-001` | Corregido; pendiente revalidación independiente | Se rechaza todo whitespace Unicode en extremos. El valor normalizado se compara en tiempo constante contra todos los placeholders prohibidos, sin registrar el valor. | 19 pruebas de `LocalSecuritySecretsPropertiesTest`, incluidas combinaciones parametrizadas de espacios, tabulaciones, CR/LF, valores válidos sin whitespace y valores no-placeholder envueltos. |
| `SEC-EN010-002` | Corregido; pendiente revalidación independiente | `tomcat.version=11.0.24` mediante la propiedad soportada por Spring Boot; core, EL y WebSocket quedan alineados. Se añade prueba de política y SBOM reproducible. | `mvn clean verify`: 55 pruebas; árbol, POM efectivo y JAR en `11.0.24`; ausencia de `11.0.22`; CycloneDX 1.6 con 45 componentes y SHA-256 reproducible. |

## Fundamento de la versión

La línea de seguridad de Apache Tomcat 11 identifica CVE-2026-55956 como
aplicable hasta `11.0.22` y corregida desde `11.0.23`; `11.0.24` incorpora
correcciones adicionales que también afectaban `11.0.23`. Spring Boot 4.1.0
documenta `tomcat.version` como propiedad de versión soportada para su familia
Tomcat 11.0.x. La implementación usa esa propiedad, sin sustituir artefactos de
forma independiente.

## Evidencia reproducible

Desde `backend/followupbussiness`, con JDK 21:

```powershell
mvn clean verify
mvn help:effective-pom "-Doutput=target/effective-pom-en010.xml"
mvn dependency:tree "-Dincludes=org.apache.tomcat.embed:*"
jar tf target/followupbussiness-0.0.1-SNAPSHOT.jar
mvn cyclonedx:makeAggregateBom@default
rg -a "11\.0\.22" target pom.xml
```

Resultados observados:

- 55 pruebas, 0 fallos, 0 errores y 0 omitidas;
- Tomcat core, EL y WebSocket `11.0.24` en POM efectivo, classpath y JAR;
- cero coincidencias de `11.0.22` en `target` y `pom.xml`;
- SBOM `target/sbom/application.cdx.json`, CycloneDX 1.6, 45 componentes,
  sin serial aleatorio;
- SHA-256 idéntico en dos generaciones:
  `EDE5F55B05B788B47621877D5CEBD3ABF96F1379600356C041AD504943D54710`.

## Limitaciones y riesgo residual

- El SBOM es un inventario; no es evidencia de análisis SCA ni de CI.
- La versión mínima debe revisarse ante nuevas publicaciones de seguridad de
  Tomcat y Spring Boot.
- La estrategia de autenticación, sesión/token, roles y autorización permanece
  reservada para BE-003, BE-004, BE-005 y BE-007.

## Estado

Remediación de Desarrollo: `READY_FOR_HANDOFF`.

QA, Ciberseguridad y DoF deben revalidar esta entrega de forma independiente.
