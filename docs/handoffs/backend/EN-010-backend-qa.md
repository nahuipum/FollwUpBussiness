# QA Backend — EN-010

> Handoff independiente de QA Backend. No es una aprobación de Desarrollo y
> no sustituye las revisiones de Ciberseguridad ni DoF.

## Estado

**PASS**

Revalidación posterior a las remediaciones `SEC-EN010-001` y
`SEC-EN010-002`. El dictamen aplica únicamente a EN-010; no aprueba ni
declara implementadas las capacidades futuras de BE-003 a BE-007.

## Ambiente y versión revisada

- Fecha: 2026-07-27 (America/Lima).
- Repositorio: `C:\Users\LUIS\OneDrive\Escritorio\FollowUpBussiness\FollwUpBussiness`.
- Rama: `feature/first`.
- HEAD: `e2393200a1e4576863d7f06b61a125fa8f0083f3`
  (`Add docker-compose infra: PostGIS, Redis, RabbitMQ`).
- Ejecución de validaciones: Maven 3.9.6 y JDK 21.0.9, fijado mediante
  `JAVA_HOME`; el Java predeterminado del host no cumple el requisito JDK 21.
- Estado del worktree: EN-010 y sus handoffs permanecen sin commit. También
  había cambios ajenos en contrato funcional, backlog e historias Backend;
  fueron preservados, no revisados para aprobación ni modificados por QA.

## Fuentes y trazabilidad revisadas

- Historia: `docs/stories/enablers/EN-010-configurar-spring-security-y-secretos-locales.md`.
- Handoff de Desarrollo: `docs/handoffs/backend/EN-010-backend-handoff.md`,
  estado `READY_FOR_HANDOFF`.
- Snapshot de Seguridad de Desarrollo:
  `docs/security/EN-010-security-review.md`; no se tomó como aprobación.
- `AGENTS.MD`, `backend/followupbussiness/AGENTS.MD`,
  `agents/qa/04_backend_qa.md`, `shared/TEAM_WORKFLOW.md`,
  `shared/PROJECT_CONTEXT.md` y `shared/ENGINEERING_RULES.md`.
- RNF-004 a RNF-008 de `00_CONTRATO_FUNCIONAL.md`; ADR-002/008/009/010;
  OpenAPI, contratos de eventos, WebSocket y sincronización.
- `pom.xml`, `application.yaml`, `.env.example`, `.gitignore`, Docker Compose,
  código y pruebas afectados de `identityaccess`.

## Observaciones recibidas y revalidación

| ID | Estado QA | Evidencia independiente |
|---|---|---|
| `SEC-EN010-001` — whitespace Unicode y comparación de placeholders | **RESUELTA** | `LocalSecuritySecretsProperties` rechaza cualquier whitespace Unicode de borde, conserva el valor original para detectar alteración y compara todos los placeholders normalizados con `MessageDigest.isEqual`. `LocalSecuritySecretsPropertiesTest`: 19/0/0/0, incluidos espacios, tabulaciones, CR/LF, placeholders y valores válidos. |
| `SEC-EN010-002` — baseline Tomcat vulnerable/SBOM | **RESUELTA** | `mvn verify`: `DependencySecurityPolicyTest` 3/0/0/0. POM efectivo y árbol de dependencias resuelven core, EL y WebSocket de Tomcat en `11.0.24`; búsqueda de `11.0.22` en `target` y `pom.xml`: sin coincidencias. SBOM CycloneDX 1.6 válido con 45 componentes y sin serial aleatorio. |
| Revisión de Ciberseguridad formal | **ABIERTA, fuera del rol QA** | El snapshot de `docs/security/EN-010-security-review.md` declara explícitamente que no es aprobación. Este handoff transfiere la evidencia actualizada a Ciberseguridad. |

## Matriz criterio → prueba → evidencia

| Criterio EN-010 | Prueba o inspección independiente | Evidencia actual | Resultado |
|---|---|---|---|
| Evidencia reproducible | `mvn verify` con JDK 21 | BUILD SUCCESS; 55 pruebas, 0 fallos, 0 errores, 0 omitidas; JAR y SBOM generados. | PASS |
| Configuración documentada | Historia, README, ADR-010, `.env.example`, `.gitignore`, handoffs | Documentan variable obligatoria, carga local explícita, regla de whitespace, dependencia Tomcat, SBOM, límites y rollback. | PASS |
| Validaciones aplicables | Contexto, seguridad, secretos, dependencias, Git y arquitectura | Surefire: 4 ArchUnit + 25 seguridad HTTP + 19 secretos + 3 dependencias + 3 política Git + 1 contexto = 55. | PASS |
| Denegación por defecto | Código, MockMvc y JAR local | `anyRequest().authenticated()` sin `permitAll`; rutas de negocio/futuras/operativas devuelven 401 sin identidad. | PASS |
| Errores no filtrantes | MockMvc y petición HTTP local | 401/403 JSON mínimos con `Cache-Control: no-store`; no incluyen stack trace, secreto, password, ruta ni Authorization. | PASS |
| Secreto obligatorio | Prueba de contexto y proceso real sin variable | Fallo antes de tráfico con mensaje seguro; no se leyó ni mostró `.env`. | PASS |
| Dependencia efectiva | POM efectivo, árbol y política de runtime | Tomcat core/EL/WebSocket 11.0.24, mínimo verificado; no 11.0.22. | PASS |
| Fuera de alcance | Búsqueda de producción y revisión de módulos | No hay controladores, usuarios, login, JWT, sesión, roles ni permisos funcionales de BE-007. | PASS |

## Comandos ejecutados y resultado

Desde `backend/followupbussiness`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn verify
mvn help:effective-pom "-Doutput=target/effective-pom-en010.xml"
mvn dependency:tree "-Dincludes=org.apache.tomcat.embed:*"
```

Resultados:

- `mvn verify` terminó en `BUILD SUCCESS` y ejecutó 55 pruebas sin fallos,
  errores ni omisiones.
- El POM efectivo fija `tomcat.version=11.0.24`.
- El árbol resolvió `tomcat-embed-core`, `tomcat-embed-el` y
  `tomcat-embed-websocket` en `11.0.24`.
- CycloneDX 2.9.1 generó y validó
  `target/sbom/application.cdx.json`: `bomFormat=CycloneDX`,
  `specVersion=1.6`, 45 componentes y sin `serialNumber`.
- `rg -a '11\.0\.22' target pom.xml` no devolvió coincidencias.

La primera ejecución dentro del sandbox no pudo obtener el parent Maven por
restricción de red. La repetición autorizada fuera del sandbox ejecutó las
validaciones correctamente; esta es una limitación de ambiente, no un defecto
del producto.

## Seguridad por defecto y ejecución dinámica

- `SecurityConfiguration` define una `SecurityFilterChain` explícita con
  `anyRequest().authenticated()`; form login, HTTP Basic, logout y request
  cache están deshabilitados.
- Se excluye `UserDetailsServiceAutoConfiguration`; el test confirma ausencia
  de usuario generado.
- `SecurityConfigurationTest` (25 pruebas) cubre `/auth/login`, refresh,
  logout, rutas de negocio, actuator, ruta inexistente, 401 y 403 por CSRF.
- Con un valor sintético en memoria, el JAR inició en puerto 18085. La petición
  anónima `GET /customers` respondió:

```text
HTTP/1.1 401
Cache-Control: no-store
Pragma: no-cache
Content-Type: application/json;charset=UTF-8

{"status":401,"code":"UNAUTHORIZED","message":"Authentication is required"}
```

- El proceso se detuvo de forma segura tras la prueba.

## Gestión de secretos y versionado

- `LocalSecuritySecretsProperties` exige
  `FOLLOW_UP_BUSSINESS_SECURITY_LOCAL_SECRET`, mínimo 32 caracteres, sin whitespace
  de borde y distinto de todos los placeholders prohibidos.
- Sin la variable, un proceso real terminó antes de 15 segundos y emitió
  `FOLLOW_UP_BUSSINESS_SECURITY_LOCAL_SECRET is required; its value was not logged`.
  No se registró ni inspeccionó valor alguno de `.env`.
- `git check-ignore -v --no-index` verificó `.env`, `.env.local`, `.secrets/`,
  `secrets-local/`, `*.key` y `*.p12`.
- `RepositorySecretsPolicyTest` pasó; no se detectaron nombres de archivos
  secretos locales en los archivos versionados.

## Arquitectura, contratos y alcance NOT_APPLICABLE

- Las cuatro pruebas ArchUnit pasan. El cambio permanece en el dominio
  `identityaccess`, con cableado en `config/` y handlers HTTP en
  `adapter/in/security/`.
- OpenAPI, eventos, WebSocket, sincronización, persistencia, migraciones,
  PostGIS, Redis, RabbitMQ y Testcontainers: **NOT_APPLICABLE**; EN-010 no
  introduce contratos, datos, endpoints de negocio ni integraciones.
- Multiempresa, autorización por recurso, idempotencia y concurrencia de
  negocio: **NOT_APPLICABLE** mientras no existan recursos de negocio y toda
  ruta permanezca denegada sin identidad.
- BE-007, login, usuarios, sesiones, JWT, refresh token, roles y permisos:
  **NOT_APPLICABLE y no implementados**.

## Defectos reproducibles

No existen defectos funcionales, arquitectónicos o de dependencia abiertos
dentro del alcance EN-010. No hay hallazgos Critical, High, Medium o Low
abiertos en esta revisión QA.

## Riesgos residuales

- El SBOM es inventario reproducible, no evidencia de análisis SCA ni CI.
- El baseline Tomcat requiere revisión frente a futuras publicaciones de
  seguridad compatibles.
- HTTPS, secretos productivos, autenticación real, sesión/token, hashing,
  RBAC, autorización por recurso y aislamiento tenant quedan reservados para
  BE-003 a BE-007.

## Handoff a Ciberseguridad

Estado de entrada: **PASS de QA Backend; revisión formal de Ciberseguridad
pendiente**.

Revisar de forma independiente:

1. Bypass HTTP, CSRF y sanitización de 401/403.
2. Validación Unicode, comparación de placeholders y ausencia de registros de
   secretos.
3. Override soportado de Tomcat, árbol efectivo 11.0.24 y SBOM CycloneDX.
4. Exclusiones Git y superficie futura de autenticación/autorización.

Evidencia disponible: resultado `mvn verify`, reportes Surefire, POM efectivo,
árbol de dependencias, SBOM, arranques con/sin secreto sintético, petición HTTP
401 y los dos handoffs. BE-007 no está implementado; no debe asumirse que
existen usuarios, roles, permisos, login o sesiones.

