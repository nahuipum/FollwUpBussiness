# Security Review — EN-011

## Superficie revisada

### Resultado

`PASS`

La corrección elimina las dos versiones vulnerables que bloquearon la revisión
anterior. `SEC-EN011-001` y `SEC-EN011-002` se cierran con evidencia
independiente en POM, POM efectivo, árbol de dependencias, classpath de pruebas,
JAR ejecutable, SBOM y avisos oficiales. No se identificaron hallazgos nuevos
Critical, High, Medium o Low dentro del alcance revisado.

### Versión revisada

- Rama: `feature/first`.
- HEAD: `34d13469731f0b89177ce5c594389b6b99a06f52`.
- Estado del workspace: no commiteado; los cambios EN-011 y sus handoffs
  permanecen locales.
- Raíz Git:
  `C:\Users\LUIS\OneDrive\Escritorio\FollowUpBussiness\FollwUpBussiness`.
- Directorio de ejecución:
  `C:\Users\LUIS\OneDrive\Escritorio\FollowUpBussiness\FollwUpBussiness\backend\followupbussiness`.
- Ambiente: Windows 11, JDK Oracle 21.0.9, Maven 3.9.6, Docker Desktop,
  Testcontainers con PostGIS `17-3.5` y PostgreSQL 17.5.
- Fecha: 2026-07-28, zona `America/Lima` (`UTC-05:00`).
- Snapshot lógico de 20 archivos revisados:
  `34CF69AB70CD773CFB70131923C778856F6AD44FC81C663F6AA691E9F4384BCE`.
- JAR reconstruido durante el retest, SHA-256:
  `5FA3FB7366387440E532DD4D9658C2A1AF8E57924043752DC20ACE4F9879FFF1`.
- SBOM CycloneDX reconstruido, SHA-256:
  `60C44EFF3AFBB6000C5BC9A225E31A991C3BCD20B91CF2043E2C047CA1374895`.
- POM efectivo del retest, SHA-256:
  `6F1B26A4A06481F93D6C24068D13BF4D394E78ED558CCBFA58FA7B43E443CEEE`.

El snapshot se calculó ordenando las rutas relativas, formando para cada
archivo `<ruta><TAB><SHA-256><LF>`, concatenando en UTF-8 con LF final y
aplicando SHA-256. Incluye historia, ADR, los tres handoffs Backend, POM,
README, configuración, modelo, migraciones y pruebas EN-011. Este handoff se
excluye para evitar autorreferencia.

### Delta exacto desde la revisión bloqueada

Snapshot anterior de 18 archivos:
`6E8FD406E64D86BC9415C8FC6A0346B7FF42180D6AEBC7492F1272B462B36B63`.

| Archivo | Evidencia de delta | Impacto |
|---|---|---|
| `pom.xml` | `BFF54...` → `D7F598E863D3B0C02F62781D0C410A29488CAE1003AE262A24B08C9E82F8FDA3` | Añade `postgresql.version=42.7.12` y `jackson-bom.version=3.1.5` |
| `DependencySecurityPolicyTest.java` | Nuevo en el snapshot | Fija baselines ejecutables para pgJDBC y Jackson |
| `README.md` | `A5D6...` → `E64437AE7CFE42365F5A3AD86B87D9A71400DF3D17E30EE994970142781A2178` | Documenta baseline coordinado |
| `ADR-011` | `2F95...` → `FAC01A21F09D1C29A0FC5E67C97F5DE5E8841D5BDD2E16FF585F140E20998761` | Documenta dependencias y limita el uso futuro de `@JsonView` |
| Handoff Desarrollo | `7AEF...` → `A186AE83BC3DAA527ADCD4A69903BAA4BE97C86FEF59713CDF6FA996D8844DE8` | Registra la corrección |
| Handoff QA | `B651...` → `5142CBBB925369381072C1305CA0E84E1CE4418987745ED7D6004AB2CF9F4CC2` | Retest QA en estado `PASS` |
| Handoff de remediación | Nuevo, `67FC3994AB31BC4BD6650E822A1572D0B2E9C16C503B93AE85A8624491CA6A3E` | Trazabilidad específica de los hallazgos |

La historia, `.env.example`, aplicación principal, `SecurityConfiguration`,
`BaseRole`, `RoleScope`, `application.yaml`, ambas migraciones y sus pruebas
funcionales conservan los hashes de la revisión anterior. Por tanto, el cambio
ejecutable de remediación está aislado al control de versiones de dependencias;
no se alteró la lógica del catálogo, la configuración de acceso ni el esquema.
El cambio concurrente `.vscode/settings.json` sigue fuera del alcance y no fue
modificado ni aprobado.

### Alcance revisado

- Catálogo cerrado:
  `PLATFORM_SUPERADMIN`, `COMPANY_ADMIN`, `SUPERVISOR`, `SELLER`.
- Ámbitos `PLATFORM` y `COMPANY`.
- Resolución exacta de códigos en dominio.
- Tabla global `identity_access_role_catalog`.
- Restricciones SQL de código, scope, relación código-scope y versión.
- Seed repetible sin duplicados.
- Configuración deny-by-default de Spring Security.
- Ausencia de endpoints, usuarios, bootstrap, asignaciones y sesión/JWT.
- Dependencias remediadas, classpath, JAR y SBOM.
- Manejo de secreto local, logs y reglas de exclusión Git.
- Handoffs de Desarrollo, remediación y QA.

### Fuentes consultadas

En el orden de precedencia aplicable:

1. Historia
   `docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md`.
2. `00_CONTRATO_FUNCIONAL.md`.
3. `docs/security/README.md`.
4. Contratos existentes en `docs/api/`, `docs/events/`, `docs/websocket/` y
   `docs/sync/`; EN-011 no añade contratos de transporte.
5. `docs/architecture/adr/ADR-011-catalogo-roles-base.md` y el índice ADR.
6. `AGENTS.MD`, `backend/followupbussiness/AGENTS.MD` y
   `agents/security/08_cybersecurity_reviewer.md`.
7. Handoff Desarrollo
   `A186AE83BC3DAA527ADCD4A69903BAA4BE97C86FEF59713CDF6FA996D8844DE8`.
8. Handoff de remediación
   `67FC3994AB31BC4BD6650E822A1572D0B2E9C16C503B93AE85A8624491CA6A3E`.
9. Handoff QA
   `5142CBBB925369381072C1305CA0E84E1CE4418987745ED7D6004AB2CF9F4CC2`.
10. Implementación, POM efectivo, árbol, classpath, JAR, SBOM y reportes
    Surefire reconstruidos.
11. Avisos oficiales:
    [GHSA-j92g-9f8w-j867](https://github.com/pgjdbc/pgjdbc/security/advisories/GHSA-j92g-9f8w-j867),
    [CVE-2026-54291](https://nvd.nist.gov/vuln/detail/CVE-2026-54291),
    [GHSA-5gvw-p9qm-jgwh](https://github.com/FasterXML/jackson-databind/security/advisories/GHSA-5gvw-p9qm-jgwh)
    y
    [CVE-2026-59889](https://nvd.nist.gov/vuln/detail/CVE-2026-59889).

No se detectaron contradicciones de seguridad entre fuentes obligatorias.
ADR-011 continúa en estado `Propuesto`; esto se conserva como riesgo de
gobernanza, no como contradicción técnica para este retest.

### Superficie de ataque modificada

- Dependencias runtime de conexión PostgreSQL y deserialización JSON.
- Modelo de dominio cerrado y tabla global de catálogo.
- Seed Flyway repetible.
- Política automatizada de versiones mínimas.
- No se añadieron endpoints REST, WebSocket, eventos, consumidores, cache,
  archivos, usuarios, sesiones, tokens ni asignaciones de rol.

### Activos afectados

- Integridad del catálogo de roles base.
- Separación semántica plataforma/empresa.
- Integridad de futuras decisiones de autorización que consuman el catálogo.
- Autenticidad de conexiones futuras a PostgreSQL.
- Integridad de futuros DTO JSON.
- Configuración local y secreto de arranque.
- JAR y SBOM de Backend.

### Actores y límites de confianza

- Cliente no autenticado frente al filtro Spring Security.
- Futuro usuario empresarial frente al Backend.
- Operador de plataforma frente a recursos globales.
- Backend frente a PostgreSQL/TLS.
- Flyway frente al esquema PostgreSQL.
- JSON no confiable frente a Jackson.
- Build Maven y repositorios de dependencias frente al artefacto.
- Workspace local frente a Git.

Las operaciones privilegiadas de asignación o elevación no existen en EN-011.
El límite plataforma/empresa se modela, pero todavía no se autoriza una
operación de negocio.

### Datos personales involucrados

Ninguno. La tabla contiene únicamente códigos públicos de rol, scope técnico y
versión. No contiene usuario, empresa, cliente, credencial, token, ubicación,
venta ni otro dato personal.

### Controles revisados

| Control | Aplica | Evidencia | Resultado |
|---|---|---|---|
| Catálogo exacto y códigos únicos | Sí | Dominio, SQL y 3 pruebas de `BaseRole` | PASS |
| Mapeo plataforma/empresa | Sí | Enum, CHECK SQL, ADR y prueba en PostgreSQL real | PASS |
| Migración limpia y repetible | Sí | 4 pruebas Testcontainers; segundo `migrate()` sin pendientes | PASS |
| Rechazo de código/scope/duplicado inválido | Sí | Constraints ejecutadas contra PostgreSQL 17.5 | PASS |
| Endpoint de elevación ausente | Sí | Sin controllers productivos y 28 pruebas HTTP | PASS |
| Deny-by-default | Sí | `anyRequest().authenticated()` y abuso JAR real | PASS |
| Sin bootstrap/usuario/JWT | Sí | Búsqueda estática y contexto sin `UserDetailsService` | PASS |
| Tenant controlado por cliente | Sí | No existe entrada ni asignación; catálogo es global por contrato | PASS |
| Baseline pgJDBC | Sí | POM, classpath, árbol, JAR y SBOM: 42.7.12 | PASS |
| Baseline Jackson | Sí | POM, classpath, árbol, JAR y SBOM: 3.1.5 | PASS |
| Secretos y logs | Sí | 3 pruebas de repositorio, 19 de propiedad y abuso de logs | PASS |
| Arquitectura hexagonal/modular | Sí | 4 pruebas ArchUnit | PASS |

### Herramientas y validaciones

| Herramienta o validación | Ejecutada | Resultado | Evidencia |
|---|---|---|---|
| Git status/diff/delta/hash | Sí | PASS | Workspace identificable; delta aislado; snapshot nuevo |
| `mvn clean verify` | Sí | PASS | 67 tests, 0 fallos, 0 errores, 0 omitidos |
| Dominio `BaseRoleTest` | Sí | PASS | 3/3 |
| HTTP `SecurityConfigurationTest` | Sí | PASS | 28/28 |
| Arquitectura ArchUnit | Sí | PASS | 4/4 |
| Migración Testcontainers | Sí | PASS | 4/4 sobre PostGIS/PostgreSQL |
| `DependencySecurityPolicyTest` | Sí | PASS | 5/5, incluida inspección de versiones runtime |
| `RepositorySecretsPolicyTest` | Sí | PASS | 3/3 |
| `LocalSecuritySecretsPropertiesTest` | Sí | PASS | 19/19 |
| POM efectivo Maven | Sí | PASS | pgJDBC 42.7.12; Jackson 3.1.5 |
| `mvn dependency:tree -Dverbose` | Sí | PASS | Versiones resueltas corregidas |
| Inspección `jar tf` | Sí | PASS | Solo `postgresql-42.7.12.jar` y `jackson-databind-3.1.5.jar` |
| SBOM CycloneDX | Sí | PASS | 58 componentes; coordenadas corregidas, sin 42.7.11/3.1.4 |
| Avisos GitHub/NVD | Sí | PASS | Las versiones resueltas son las versiones parcheadas |
| JAR real + `curl` | Sí | PASS | Seis abusos devuelven 401 seguro |
| Búsqueda estática de entradas/auth/bootstrap | Sí | PASS | Sin mappings productivos ni mecanismo oculto |
| `git diff --check` | Sí | PASS | Exit 0 antes de actualizar este handoff |
| SAST integral | No | NOT_EXECUTED | No se recibió artefacto o configuración SAST del snapshot |
| SCA integral | No | NOT_EXECUTED | Revisión dirigida por versión/SBOM/advisory; no sustituye SCA |
| DAST autenticado | No | NOT_APPLICABLE | EN-011 no implementa autenticación ni endpoint de negocio |
| Escaneo de imagen | No | NOT_APPLICABLE | EN-011 no cambia imágenes o despliegue |

Las validaciones no ejecutadas no impiden una conclusión confiable sobre los
dos hallazgos originales: su presencia y corrección se determinan por
coordenada y versión exactas, verificadas en todas las capas del artefacto.

### Dependencias y cadena de suministro

- `org.postgresql:postgresql` resuelve a 42.7.12. El advisory oficial marca
  `>=42.7.4,<42.7.12` como afectado y 42.7.12 como parcheado.
- `tools.jackson.core:jackson-databind` resuelve a 3.1.5. El advisory oficial
  marca 3.0.0–3.1.4 como afectado y 3.1.5 como parcheado.
- El POM efectivo, classpath de pruebas, árbol Maven, JAR y SBOM son
  coherentes.
- El test de política impide volver silenciosamente a 42.7.11 o 3.1.4.
- El SBOM mantiene 58 componentes y no contiene las coordenadas vulnerables.
- No se agregaron repositorios, versiones dinámicas, plugins no fijados ni
  scripts de instalación.

### Secretos

- No se observó secreto activo, clave privada, token o URL con credenciales.
- `.env.example` contiene únicamente placeholders documentados y rechazados
  por la aplicación.
- `.env`, directorios locales de secretos, keystores y claves están ignorados.
- El secreto sintético del retest no apareció en logs.
- No se leyó ningún `.env` real.

### Autenticación y autorización

- `SecurityConfiguration` conserva
  `authorizeHttpRequests(...anyRequest().authenticated())`.
- Form login, HTTP Basic, logout y request cache permanecen deshabilitados.
- No hay usuario por defecto, `UserDetailsService`, JWT, parser Bearer,
  asignación ni elevación.
- La ausencia deliberada de autenticación funcional causa 401 y no crea un
  bypass.
- La autorización por recurso sigue fuera de EN-011 y deberá implementarse en
  historias posteriores.

### Aislamiento multiempresa

El catálogo es global y no persiste `tenantId`, conforme a la historia y
ADR-011. No existe operación CRUD ni asignación desde la que intentar acceso
cruzado. Los roles de empresa están marcados `COMPANY`; esa marca no constituye
por sí misma autorización. Las historias de usuarios, sesiones y asignaciones
deberán derivar tenant del contexto autenticado y aplicar autorización por
objeto.

### Privacidad y geolocalización

No aplica: EN-011 no captura, persiste, consulta ni exporta ubicación o datos
personales.

### Datos locales y Mobile

No aplica: no hay cambio Flutter, almacenamiento local, cola offline, permisos
o sesión móvil.

### APIs y validación de entrada

No existen controllers productivos ni DTO de entrada EN-011. Las rutas
hipotéticas son interceptadas por Spring Security y devuelven un JSON 401
estable sin stack trace. Los códigos se resuelven por coincidencia exacta en
dominio y la base rechaza código, scope, combinación o versión inválidos.

### WebSocket, Redis y RabbitMQ

No aplica: EN-011 no introduce handshake, suscripción, mensajes, eventos,
colas, consumers, cache o keys.

### Persistencia y PostGIS

Aplica PostgreSQL para el catálogo; no aplica la función geográfica PostGIS.
Las consultas de prueba usan JDBC parametrizado donde corresponde. Los CHECK,
PK y seed se validaron en PostgreSQL real. No se cambiaron credenciales,
privilegios, red, backup o retención.

### Infraestructura y CI/CD

No se cambió Docker, infraestructura ni pipeline. Testcontainers utilizó la
imagen preexistente. No se recibió ejecución CI del snapshot; la evidencia se
reprodujo localmente.

### Logs, auditoría y observabilidad

La migración no expone password y el arranque no registra el secreto local ni
genera credencial por defecto. EN-011 no implementa acciones de usuario que
requieran auditoría funcional. No se observó PII ni token en logs.

## Amenazas y pruebas de abuso

### Threat model resumido

| Amenaza | Escenario | Control existente | Resultado |
|---|---|---|---|
| Spoofing | Cliente declara rol/tenant/usuario por body, query o header | Sin mapping productivo; filtro exige autenticación | MITIGADA |
| Tampering | Alterar código, scope, versión o duplicar rol | Enum cerrado, PK y CHECK SQL | MITIGADA |
| Tampering | MITM degrada channel binding PostgreSQL | pgJDBC 42.7.12 parcheado | MITIGADA |
| Tampering/EoP | Mass assignment por `@JsonView` + `@JsonUnwrapped` | Jackson 3.1.5 parcheado; anotaciones ausentes | MITIGADA |
| Repudiation | Seed inconsistente o repetido | Flyway versionado y seed repetible | MITIGADA |
| Information Disclosure | Respuesta/log filtra secreto, password o internals | Entry point seguro y pruebas de logs | MITIGADA |
| Denial of Service | Payload o método alcanza lógica inexistente | Rechazo 401 antes de mapping | MITIGADA en alcance |
| Elevation of Privilege | Crear o asignarse `PLATFORM_SUPERADMIN` | Sin endpoint, usuario, asignación ni bootstrap | MITIGADA |

### Pruebas de abuso

| Escenario | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|
| Código desconocido o vacío en dominio | No convertirse en rol | Rechazado | PASS |
| Insertar código arbitrario | Constraint rechaza | Rechazado | PASS |
| Insertar duplicado | PK rechaza | Rechazado | PASS |
| Scope inválido o combinación `SELLER/PLATFORM` | CHECK rechaza | Rechazado | PASS |
| Versión distinta de 1 | CHECK rechaza | Rechazado | PASS |
| Ejecutar seed dos veces | Sin duplicados | Cuatro filas exactas | PASS |
| Reaplicar Flyway | Sin migraciones pendientes | `migrationsExecuted=0` | PASS |
| GET `/roles` sin sesión | 401 | 401 JSON seguro | PASS |
| POST con rol/tenant/user en body | 401; sin elevación | 401 JSON seguro | PASS |
| GET con rol/tenant en query | 401; sin autoridad de cliente | 401 JSON seguro | PASS |
| POST con `X-Role` y `X-Tenant-Id` | 401; headers no confiables | 401 JSON seguro | PASS |
| PATCH `/roles/PLATFORM_SUPERADMIN` | 401; sin asignación | 401 JSON seguro | PASS |
| POST con Bearer falso y rol privilegiado | 401; sin JWT oculto | 401 JSON seguro | PASS |
| Inspección de logs del JAR | Sin secreto ni password generado | No aparecen | PASS |
| Classpath con pgJDBC 42.7.11 | Debe estar ausente | Ausente; 42.7.12 | PASS |
| Classpath con Jackson 3.1.4 | Debe estar ausente | Ausente; 3.1.5 | PASS |

La prueba JAR utilizó puerto local 18091, datasource auto-configurada excluida
y un secreto sintético efímero. No se ejecutó contra ambiente compartido ni
productivo.

## Hallazgos

### Resumen

| ID | Severidad | Título | Componente | Estado |
|---|---|---|---|---|
| SEC-EN011-001 | High | pgJDBC vulnerable a downgrade de channel binding | Backend / PostgreSQL JDBC | CLOSED |
| SEC-EN011-002 | Medium | Jackson Databind vulnerable a bypass de `@JsonView` | Backend / serialización JSON | CLOSED |

No se identificaron hallazgos nuevos.

### Detalle de hallazgos

#### SEC-EN011-001 — pgJDBC vulnerable a downgrade de channel binding

- Severidad: High.
- CWE: CWE-636, CWE-757.
- Activo: autenticidad e integridad de la conexión Backend–PostgreSQL.
- Historia: EN-011.
- Componente: `org.postgresql:postgresql`.
- Condición original: el artefacto resolvía 42.7.11, dentro del rango
  `>=42.7.4,<42.7.12` afectado por CVE-2026-54291.
- Pasos de reproducción del retest:
  1. Inspeccionar override y POM efectivo.
  2. Resolver árbol Maven.
  3. Cargar `org.postgresql.Driver` desde el classpath y leer su versión.
  4. Inspeccionar `BOOT-INF/lib` del JAR.
  5. Consultar la coordenada en el SBOM.
  6. Contrastar con el advisory oficial.
- Evidencia: todas las capas resuelven 42.7.12; el JAR contiene únicamente
  `postgresql-42.7.12.jar`; el SBOM declara
  `pkg:maven/org.postgresql/postgresql@42.7.12?type=jar`; la política runtime
  pasa y el advisory declara 42.7.12 parcheado.
- Impacto original: un atacante en posición de interceptar TLS podía degradar
  silenciosamente `SCRAM-SHA-256-PLUS` cuando se exigía channel binding.
- Probabilidad: condicionada a posición de red y configuración
  `channelBinding=require`; el componente vulnerable ya no está presente.
- Recomendación: conservar pgJDBC 42.7.12 o superior, mantener la prueba de
  baseline y ejecutar SCA continuo.
- Estado: `CLOSED`.
- Responsable: Desarrollo Backend realizó la remediación; Ciberseguridad
  verificó el cierre.
- Condición de retest: satisfecha. Cualquier cambio futuro de pgJDBC requiere
  repetir POM efectivo, árbol, classpath, JAR, SBOM y advisory.

#### SEC-EN011-002 — Jackson Databind vulnerable a bypass de `@JsonView`

- Severidad: Medium.
- CWE: CWE-863.
- Activo: integridad de futuros DTO y decisiones de autorización de escritura.
- Historia: EN-011.
- Componente: `tools.jackson.core:jackson-databind`.
- Condición original: el artefacto resolvía 3.1.4, dentro del rango
  `>=3.0.0,<3.1.5` afectado por CVE-2026-59889.
- Pasos de reproducción del retest:
  1. Inspeccionar BOM override y POM efectivo.
  2. Resolver árbol Maven.
  3. Cargar `tools.jackson.databind.ObjectMapper` y leer su versión.
  4. Inspeccionar `BOOT-INF/lib` del JAR.
  5. Consultar la coordenada en el SBOM.
  6. Buscar `@JsonView` y `@JsonUnwrapped` en código productivo.
  7. Contrastar con el advisory oficial.
- Evidencia: todas las capas resuelven 3.1.5; el JAR contiene únicamente
  `jackson-databind-3.1.5.jar`; el SBOM declara
  `pkg:maven/tools.jackson.core/jackson-databind@3.1.5?type=jar`; no existen
  las anotaciones afectadas y el advisory declara 3.1.5 parcheado.
- Impacto original: un DTO futuro que usara ambas anotaciones como barrera de
  escritura podía aceptar campos privilegiados bajo una vista menos
  privilegiada.
- Probabilidad: el gadget no existía en EN-011, pero la librería afectada sí;
  la versión vulnerable ya no está presente.
- Recomendación: conservar Jackson Databind 3.1.5 o superior, no usar
  `@JsonView` como único control de autorización y mantener DTO allowlist.
- Estado: `CLOSED`.
- Responsable: Desarrollo Backend realizó la remediación; Ciberseguridad
  verificó el cierre.
- Condición de retest: satisfecha. Ante cambios de Jackson o DTO, repetir
  resolución de artefacto y pruebas de mass assignment.

## Riesgos residuales

### Riesgos no incompatibles con la liberación

- ADR-011 sigue `Propuesto`; debe aprobarse por gobernanza antes de que
  historias dependientes consuman estos códigos.
- El workspace no está commiteado. Cualquier modificación de los 20 archivos,
  JAR o SBOM invalida esta evidencia y exige retest.
- El JAR no es byte-a-byte reproducible entre builds por metadatos de
  empaquetado; se revisó el artefacto reconstruido en este retest y su contenido
  de dependencias.
- No se recibió CI, SAST ni SCA integral. La revisión manual dirigida y las
  políticas runtime cubren los dos CVE conocidos, pero no sustituyen vigilancia
  continua del árbol completo.
- Las advertencias Mockito sobre agente dinámico y CycloneDX sobre keywords no
  demostraron riesgo del runtime EN-011.
- No se ejecutó un exploit MITM real ni una explotación de Jackson vulnerable,
  porque las versiones afectadas ya no están en el artefacto y una prueba de
  red destructiva no era necesaria para validar el cierre por versión exacta.

### Controles no aplicables

- Geolocalización, jornadas, rutas y PostGIS geográfico.
- Mobile, almacenamiento local y sincronización offline.
- Frontend, browser storage, CSP y XSS.
- WebSocket y ubicación en tiempo real.
- Redis y cache multiempresa.
- RabbitMQ, replay y consumidores.
- Importación/exportación de archivos.
- Endpoints administrativos, CORS y rate limiting de negocio.
- Infraestructura, imágenes y CI/CD.

No aplican porque EN-011 no modifica esas superficies.

### Condiciones para nueva revisión

1. Cambio en cualquiera de los 20 archivos del snapshot.
2. Cambio de versión efectiva de pgJDBC, Jackson, Spring, Tomcat o Flyway.
3. Aparición de endpoint, usuario, bootstrap, JWT, sesión o asignación de rol.
4. Uso de rol o `tenantId` desde body, query, header, token o evento.
5. Uso de `@JsonView`, `@JsonUnwrapped` o binding directo a entidad privilegiada.
6. Cambio de migración, scope, códigos o versión del catálogo.
7. Evidencia nueva de vulnerabilidad que afecte las versiones resueltas.

## Estado

### Resultado

`PASS`

### Recomendación final

EN-011 puede avanzar al control independiente de Definition of Finished sobre
el snapshot identificado. `SEC-EN011-001` y `SEC-EN011-002` están cerrados con
evidencia reproducible; no quedan hallazgos Critical, High o Medium abiertos y
los controles de catálogo, acceso deny-by-default, migración, secretos y cadena
de suministro aplicables pasaron.

PASS no afirma invulnerabilidad total. Se limita a la versión y superficie
descritas; cualquier cambio que cumpla una condición de nueva revisión invalida
esta conclusión.
