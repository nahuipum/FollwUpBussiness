# Security Review — EN-010

> Handoff independiente de Ciberseguridad para DoF. Este documento registra la
> revisión final de EN-010 y no sustituye las validaciones de QA ni DoF.

## Resultado

**PASS**

No se identificaron riesgos Critical, High, Medium o Low abiertos dentro del
alcance revisado. Los hallazgos `SEC-EN010-001` y `SEC-EN010-002` fueron
retesteados de forma independiente y se encuentran cerrados con evidencia.

PASS significa que no se identificaron riesgos abiertos incompatibles con la
liberación dentro de EN-010; no afirma que el producto completo sea
invulnerable ni que capacidades futuras de autenticación, autorización o
aislamiento multiempresa estén implementadas.

## Versión revisada

- Historia:
  `docs/stories/enablers/EN-010-configurar-spring-security-y-secretos-locales.md`.
- Rama: `feature/first`.
- HEAD base: `e2393200a1e4576863d7f06b61a125fa8f0083f3`.
- Estado del workspace: sucio y sin commit; EN-010 y sus handoffs son cambios
  locales no comprometidos.
- Ambiente: Windows/PowerShell, Maven 3.9.6 y JDK 21.
- Fecha de revisión final: 2026-07-28, zona `America/Lima`.
- Snapshot lógico de los 20 archivos revisados:
  `F1D4CB5F16CE2266C8FC708DC1CA37641D3C87AFD6007D607016DB1D683A2854`.
- JAR revisado, SHA-256:
  `6006C59631E7EFD458514E087E44C3705D590DC6BF61ECE5747B528150A082D4`.
- SBOM revisado, SHA-256:
  `EDE5F55B05B788B47621877D5CEBD3ABF96F1379600356C041AD504943D54710`.

El snapshot lógico se calculó sobre líneas ordenadas con el formato
`<ruta-relativa><TAB><SHA-256-del-archivo><LF>`, codificadas en UTF-8 y con LF
final. Incluye:

- `.env.example`;
- `.gitignore`;
- `backend/followupbussiness/pom.xml`;
- `backend/followupbussiness/README.md`;
- `FollowupbussinessApplication.java` y su prueba de contexto;
- `LocalSecuritySecretsProperties.java`;
- `SecurityConfiguration.java`;
- los tres handlers HTTP de seguridad;
- las pruebas de secretos, configuración HTTP, dependencias y política del
  repositorio;
- ADR-010;
- la historia EN-010;
- los handoffs de Desarrollo y QA;
- el snapshot de remediación de Desarrollo en
  `docs/security/EN-010-security-review.md`.

El presente handoff se excluye deliberadamente del snapshot porque se creó
después de completar la revisión. El estado sin commit exige que DoF compare
estos identificadores o repita las validaciones si cualquiera de los archivos
revisados cambia.

## Alcance revisado

- Incorporación y configuración explícita de Spring Security.
- Política HTTP `deny by default`.
- Respuestas JSON de autenticación/autorización y cabeceras no cacheables.
- Deshabilitación de mecanismos de autenticación no previstos.
- Canal local obligatorio para inyección de un secreto fundacional.
- Validación, fallo seguro y ausencia de exposición del secreto.
- Reglas Git para excluir material sensible local.
- Dependencias efectivas Spring Security y Apache Tomcat.
- Generación reproducible de SBOM CycloneDX.
- Pruebas unitarias, de contexto, MockMvc y ejecución dinámica del JAR.
- Documentación y ADR relacionados con EN-010.

Quedaron fuera de alcance los usuarios reales, login funcional, sesiones,
JWT/refresh tokens, hashing de contraseñas, roles, permisos por recurso,
aislamiento tenant de datos, frontend, mobile, persistencia, migraciones,
PostGIS, Redis, RabbitMQ, WebSocket, CI/CD y despliegue productivo. Estas
capacidades no fueron declaradas implementadas ni aprobadas por esta revisión.

## Fuentes consultadas

Se aplicó el orden de precedencia del repositorio y del rol de Ciberseguridad:

1. Historia refinada EN-010 y sus criterios de aceptación.
2. `00_CONTRATO_FUNCIONAL.md` y
   `docs/functional/contrato-funcional.md`.
3. Requerimientos y documentación bajo `docs/security/`.
4. Contratos bajo `docs/api/`, `docs/events/`, `docs/websocket/` y
   `docs/sync/`; no fueron modificados por EN-010.
5. ADR-002, ADR-008, ADR-009 y
   `docs/architecture/adr/ADR-010-linea-base-seguridad-secretos-locales.md`.
6. `AGENTS.MD`, `backend/followupbussiness/AGENTS.MD`,
   `agents/security/08_cybersecurity_reviewer.md`,
   `shared/PROJECT_CONTEXT.md`, `shared/ENGINEERING_RULES.md` y
   `shared/TEAM_WORKFLOW.md`.
7. Handoff de Desarrollo:
   `docs/handoffs/backend/EN-010-backend-handoff.md`, SHA-256
   `08B24A224BFB6013280CE4FBA35C1AE88DE5C3D45FE1BD8157A358B87EF31AE8`,
   estado `READY_FOR_HANDOFF`.
8. Handoff de QA:
   `docs/handoffs/backend/EN-010-backend-qa.md`, SHA-256
   `B27A174794B2331063BBCE7E7F4048D86FFEE8F1FC4B181FB500CF222151BBA4`,
   estado `PASS`.
9. Código, configuración, pruebas, POM efectivo, árbol de dependencias, JAR y
   SBOM del snapshot indicado.
10. Avisos oficiales de Apache Tomcat 11:
    <https://tomcat.apache.org/security-11.html>.

El documento `docs/security/EN-010-security-review.md` fue tratado como
evidencia de remediación de Desarrollo, no como aprobación independiente.

## Superficie de ataque modificada

- Cadena de filtros HTTP de Spring Security para todas las rutas.
- Handlers de respuestas `401` y `403`.
- Auto-configuración de autenticación deshabilitada.
- Variable de entorno `FIELD_SALES_SECURITY_LOCAL_SECRET` durante el arranque.
- Validación de placeholders, longitud y whitespace Unicode de borde.
- Classpath de runtime con Spring Security y Tomcat embebido.
- Build Maven y generación de SBOM.
- Archivos locales potencialmente sensibles y sus reglas de exclusión Git.

No se añadieron endpoints de negocio, usuarios, credenciales reales,
persistencia, mensajería, sockets, archivos importables ni datos de tenant.

## Activos afectados

- Disponibilidad segura del servicio durante el arranque.
- Configuración y secretos locales.
- Frontera HTTP del backend.
- Mensajes y metadatos de error.
- Integridad del classpath y del artefacto ejecutable.
- Inventario de componentes del SBOM.
- Repositorio Git y archivos locales excluidos.

## Actores y límites de confianza

- Actor anónimo externo frente a la frontera HTTP.
- Proceso backend y cadena de filtros Spring Security.
- Operador/desarrollador que inyecta configuración local mediante el entorno.
- Sistema operativo y variables del proceso.
- Maven Central/gestión de dependencias frente al build local.
- Workspace Git frente a archivos de secretos no versionables.

No existe todavía un actor autenticado de negocio. Una identidad sintética se
usó únicamente en MockMvc para alcanzar de forma controlada el rechazo CSRF
`403`.

## Datos personales involucrados

EN-010 no crea, procesa ni persiste datos personales. No se incorporaron
usuarios, clientes, ventas, ubicaciones, recorridos ni archivos. Se verificó
que errores y logs no expusieran secretos ni cabeceras de autorización.

## Threat model resumido

| Amenaza | Escenario | Control existente | Resultado |
|---|---|---|---|
| Spoofing | Acceder con Basic/Bearer falsos o mediante rutas de autenticación aún no implementadas | `anyRequest().authenticated()`, form login y HTTP Basic deshabilitados, sin usuario autogenerado | MITIGADA |
| Tampering | Usar placeholder alterado con whitespace o manipular el secreto de arranque | Rechazo de whitespace Unicode de borde, longitud mínima y comparación normalizada contra todos los placeholders | MITIGADA |
| Repudiation | Respuestas ambiguas o errores internos difíciles de correlacionar | Cuerpos JSON deterministas; auditoría funcional queda fuera de esta historia | ACEPTABLE EN ALCANCE |
| Information Disclosure | Filtrar secreto, stack trace, ruta o `Authorization` en errores/logs | Mensajes genéricos, valor nunca registrado, `no-store`, pruebas de contenido negativo | MITIGADA |
| Denial of Service | Iniciar con configuración inválida o enviar métodos/rutas no previstas | Fallo temprano seguro; toda ruta anónima es rechazada; no se expone endpoint público | MITIGADA EN ALCANCE |
| Elevation of Privilege | Bypass mediante actuator, rutas no mapeadas, `/error`, login/refresh/logout, Basic o Bearer | Matriz MockMvc y ejecución dinámica confirman `401`; contexto sintético insuficiente con CSRF produce `403` | MITIGADA |
| Supply chain | Ejecutar Tomcat afectado o producir inventario no determinista | Override fijo a 11.0.24, prueba de política, árbol/JAR/SBOM coherentes | MITIGADA PARA EL SNAPSHOT |

## Controles revisados

| Control | Aplica | Evidencia | Resultado |
|---|---|---|---|
| Denegación por defecto | Sí | Configuración, 25 pruebas HTTP y ejecución dinámica | PASS |
| Ausencia de bypass de autenticación | Sí | Login/refresh/logout, actuator, `/error`, ruta inexistente, Basic/Bearer falsos | PASS |
| CSRF | Sí, como baseline | Solicitud mutable anónima `401`; identidad sintética sin token CSRF `403` | PASS |
| Errores no filtrantes | Sí | JSON mínimo, sin stack trace/ruta/secreto/Authorization | PASS |
| No cachear errores de seguridad | Sí | `Cache-Control: no-store`, `Pragma: no-cache` | PASS |
| Cabeceras de hardening | Sí | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` | PASS |
| Secreto requerido | Sí | Arranque válido y fallo seguro sin variable | PASS |
| Calidad del secreto local | Sí | 19 pruebas de valores válidos, longitud, placeholders y whitespace | PASS |
| No registrar el valor | Sí | Inspección y proceso real de fallo; mensaje solo identifica variable/regla | PASS |
| Exclusión Git | Sí | `git check-ignore` y prueba de política del repositorio | PASS |
| Versiones de dependencias | Sí | POM efectivo, árboles, JAR, classpath y prueba de política | PASS |
| SBOM reproducible | Sí | CycloneDX 1.6, 45 componentes, dos hashes idénticos | PASS |
| Secret scanning manual | Sí | Búsqueda de patrones y nombres sensibles; solo placeholders públicos y fixtures sintéticos | PASS |
| Aislamiento multiempresa | No | No existen recursos, tenant ni acceso autenticado en EN-010 | NOT_APPLICABLE |

## Herramientas y validaciones

| Herramienta o validación | Ejecutada | Resultado | Evidencia |
|---|---|---|---|
| Maven 3.9.6 / JDK 21 — `mvn test` | Sí, Ciberseguridad | 55 pruebas; 0 fallos, 0 errores, 0 omitidas | Salida local fresca y reportes Surefire |
| Maven — pruebas focalizadas | Sí, Ciberseguridad | 22 pruebas; 19 de secretos y 3 de política de dependencias, todas PASS | `mvn "-Dtest=LocalSecuritySecretsPropertiesTest,DependencySecurityPolicyTest" test` |
| MockMvc | Sí | 25 pruebas de seguridad HTTP, incluido `401` y `403` | Suite Maven |
| JAR Spring Boot | Sí | Arranque válido; matriz HTTP protegida; fallo seguro con secreto inválido | Ejecución dinámica local |
| Maven dependency tree | Sí | Spring Security 7.1.0; Tomcat core/EL/WebSocket 11.0.24 | Árboles resueltos |
| POM efectivo | Sí | `tomcat.version=11.0.24`; CycloneDX Maven Plugin 2.9.1 | `target/effective-pom-en010-security-retest.xml` |
| CycloneDX SBOM | Sí | Especificación 1.6, 45 componentes, hash reproducible | `target/sbom/application.cdx.json` |
| Secret scan manual con `rg` | Sí | Sin secreto activo ni bloque de clave privada; coincidencias justificadas como placeholders/fixtures | Revisión del snapshot |
| `git check-ignore` | Sí | `.env`, variantes locales, directorios de secretos, `.key` y `.p12` ignorados | Reglas de `.gitignore` |
| `git diff --check` | Sí | Código de salida 0 al cierre técnico | Workspace revisado |
| SCA/DAST/escaneo de imagen/CI | No | `NOT_EXECUTED`; no había evidencia correspondiente al snapshot | Limitación declarada; el SBOM no sustituye SCA |

QA ejecutó adicionalmente `mvn verify` con 55 pruebas y `BUILD SUCCESS`.
Ciberseguridad revisó esa evidencia, pero no la presenta como ejecución propia.

## Pruebas de abuso

| Escenario | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|
| `GET /customers` anónimo | `401` JSON genérico | `401`, sin datos ni detalles internos | PASS |
| `POST /customers` anónimo | `401`, no llegar a negocio | `401` | PASS |
| `OPTIONS /customers` anónimo | No habilitar bypass CORS/preflight | `401` | PASS |
| Actuator health/readiness anónimo | No exponer operación | `401` | PASS |
| `/auth/login`, refresh y logout | No habilitar endpoints futuros | `401` | PASS |
| `/error` y ruta no mapeada | No filtrar error ni evitar seguridad | `401` | PASS |
| Credencial HTTP Basic falsa | No activar Basic ni autenticar | `401` | PASS |
| Bearer falso | No aceptar token ni revelar validación interna | `401` | PASS |
| Identidad sintética sin CSRF en operación mutable | Denegar por CSRF | `403` JSON genérico | PASS |
| Secreto ausente | Fallar antes de servir tráfico y no mostrar valor | Proceso termina con código 1 y mensaje seguro | PASS |
| Placeholder con espacio/tab/CR/LF de borde | Rechazar la variante alterada | Rechazado en 19 pruebas y proceso real con espacio final | PASS |
| Valor válido sintético | Permitir el arranque sin registrar el valor | Aplicación inicia | PASS |
| Buscar Tomcat 11.0.22 en POM, classpath, JAR y SBOM | Sin versión vulnerable previa | Sin coincidencias; módulos en 11.0.24 | PASS |
| Intentar versionar archivos sensibles locales | Deben quedar ignorados | Las rutas representativas resuelven reglas Git | PASS |

No se ejecutaron pruebas destructivas ni contra ambientes compartidos o
productivos.

## Comandos reproducibles y evidencia

Desde `backend/followupbussiness`, con JDK 21:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn test
mvn "-Dtest=LocalSecuritySecretsPropertiesTest,DependencySecurityPolicyTest" test
mvn dependency:tree "-Dincludes=org.apache.tomcat.embed:*"
mvn dependency:tree "-Dscope=compile" "-Dincludes=org.springframework.boot:spring-boot-starter-security,org.springframework.security:*"
mvn help:effective-pom "-Doutput=target/effective-pom-en010-security-retest.xml"
jar tf target/followupbussiness-0.0.1-SNAPSHOT.jar
rg -a "11\.0\.22" target pom.xml
```

Desde la raíz:

```powershell
git status --short --branch
git check-ignore -v --no-index -- .env backend/followupbussiness/.env.local backend/followupbussiness/secrets-local/runtime.txt backend/followupbussiness/local-signing.key backend/followupbussiness/local-keystore.p12
git diff --check
```

Para las pruebas dinámicas debe utilizarse únicamente un valor sintético local
de 32 o más caracteres, inyectado en el entorno del proceso, y nunca incluirlo
en comandos persistidos, documentación o logs. La matriz de rutas y métodos
está codificada de forma reproducible en `SecurityConfigurationTest`.

## Hallazgos

| ID | Severidad | Título | Componente | Estado |
|---|---|---|---|---|
| SEC-EN010-001 | Low | Placeholder alterado mediante whitespace de borde podía superar la validación exacta | Gestión local de secretos | CLOSED |
| SEC-EN010-002 | Low | Baseline Tomcat 11.0.22 mantenía avisos corregidos posteriormente | Dependencias/runtime | CLOSED |

No existen hallazgos abiertos.

## Detalle de hallazgos

### SEC-EN010-001 — Bypass de placeholder mediante whitespace de borde

- Severidad: Low.
- CWE: CWE-20, Improper Input Validation.
- Activo: configuración y secreto local de arranque.
- Historia: EN-010.
- Componente:
  `identityaccess/config/LocalSecuritySecretsProperties.java`.
- Condición original: la comparación exacta podía aceptar un placeholder
  público con espacio u otro whitespace añadido al inicio o final.
- Pasos de reproducción originales: asignar a la variable requerida un
  placeholder documentado con espacio, tabulación, CR o LF de borde e intentar
  iniciar la aplicación.
- Evidencia de cierre: la implementación conserva el valor original para
  detectar alteración, rechaza whitespace Unicode de borde y compara todos los
  placeholders normalizados mediante `MessageDigest.isEqual`.
  `LocalSecuritySecretsPropertiesTest` ejecutó 19 casos sin fallos; un proceso
  real con espacio final terminó con código 1 sin exponer el valor.
- Impacto original: uso accidental o deliberado de una credencial pública
  conocida como configuración aparentemente válida.
- Probabilidad original: limitada al entorno local y a un operador capaz de
  controlar la variable.
- Recomendación aplicada: validar bordes antes de aceptar el valor y comparar
  de forma normalizada contra todo el catálogo prohibido.
- Estado: CLOSED.
- Responsable de corrección: Desarrollo Backend.
- Condición de retest satisfecha: espacios, tabulaciones, CR, LF, CRLF,
  placeholders exactos/alterados y valores válidos cubiertos; arranque real
  falla de forma segura.

### SEC-EN010-002 — Baseline Tomcat con correcciones de seguridad pendientes

- Severidad: Low.
- CWE: CWE-1104, Use of Unmaintained Third Party Components.
- Activo: runtime HTTP y cadena de suministro.
- Historia: EN-010.
- Componente: `backend/followupbussiness/pom.xml`, classpath, JAR y SBOM.
- Condición original: Tomcat embebido 11.0.22 estaba fijado aunque Apache ya
  publicaba correcciones posteriores aplicables.
- Pasos de reproducción originales: resolver el POM/árbol de dependencias y
  buscar `tomcat-embed-core`, `tomcat-embed-el` y
  `tomcat-embed-websocket` en 11.0.22.
- Evidencia de cierre: el POM fija 11.0.24; el POM efectivo, árbol, classpath,
  JAR y SBOM resuelven los tres módulos en 11.0.24; la búsqueda de 11.0.22 no
  devuelve coincidencias. `DependencySecurityPolicyTest` ejecutó 3 casos sin
  fallos. Los avisos oficiales de Apache confirman la corrección en 11.0.24 de
  los casos que afectaban 11.0.22/11.0.23.
- Impacto original: exposición a fallos conocidos del contenedor HTTP en
  escenarios dependientes de configuración y uso.
- Probabilidad original: limitada por la ausencia de endpoints públicos y
  despliegue productivo, pero verificable en el classpath.
- Recomendación aplicada: mantener core, EL y WebSocket en una versión mínima
  segura y comprobarlo en build, runtime y SBOM.
- Estado: CLOSED.
- Responsable de corrección: Desarrollo Backend.
- Condición de retest satisfecha: versión 11.0.24 coherente en POM efectivo,
  árbol, JAR, runtime y SBOM; política automatizada y búsqueda negativa de
  11.0.22.

## Dependencias y cadena de suministro

- Spring Boot Security 4.1.0 y Spring Security 7.1.0 se resuelven mediante la
  gestión de dependencias del proyecto.
- Tomcat core, EL y WebSocket se resuelven de forma uniforme en 11.0.24.
- No se observaron repositorios no confiables, versiones dinámicas ni scripts
  de instalación agregados por EN-010.
- CycloneDX Maven Plugin 2.9.1 genera un SBOM 1.6 de 45 componentes.
- Dos generaciones del SBOM produjeron el mismo SHA-256 y no incluyen
  `serialNumber` aleatorio.
- El SBOM es inventario; no constituye un análisis SCA. No se recibió resultado
  de SCA o escaneo de imagen asociado al snapshot.

## Secretos

- No se identificó ningún secreto activo expuesto.
- `.env.example` contiene únicamente placeholders públicos deliberadamente no
  válidos.
- El secreto local no tiene valor por defecto, debe suministrarse mediante el
  entorno y no se registra.
- La aplicación falla antes de servir tráfico cuando la variable falta o es
  inválida.
- `.env`, variantes locales, directorios de secretos, claves privadas y
  keystores representativos están excluidos por Git.
- La búsqueda manual de patrones sensibles no encontró bloques de clave
  privada ni credenciales activas dentro del snapshot.

## Autenticación y autorización

Toda solicitud requiere autenticación. No existen `permitAll`, usuario
autogenerado, form login, HTTP Basic, logout ni endpoints funcionales de
login/refresh. La configuración no inventa usuarios, roles o tokens. Los
rechazos `401`/`403` son genéricos, no cacheables y no filtran información
interna.

La autenticación real, sesiones, revocación, refresh tokens, fuerza bruta,
rate limiting y autorización por objeto pertenecen a historias posteriores y
no se consideran implementadas.

## Aislamiento multiempresa

NOT_APPLICABLE para EN-010. No se crean entidades, tenant, consultas,
persistencia, caches, exports ni identidades funcionales. La denegación global
impide acceso anónimo a rutas. El aislamiento multiempresa deberá validarse
cuando BE-007 y los recursos de negocio lo implementen.

## Privacidad y geolocalización

NOT_APPLICABLE. EN-010 no captura, consulta, transmite ni persiste ubicación o
datos personales.

## Datos locales y Mobile

NOT_APPLICABLE. No hay cambios Flutter/Android, almacenamiento móvil, cola
offline, permisos ni tokens locales.

## APIs y validación de entrada

No se añadió API de negocio ni se modificó OpenAPI. La entrada nueva es la
variable de entorno de arranque, validada por presencia, longitud mínima,
whitespace Unicode de borde y catálogo de placeholders. Las rutas HTTP
existentes, futuras, operativas y no mapeadas quedan protegidas por defecto.

## WebSocket

NOT_APPLICABLE. No se incorporó handshake, suscripción, tópico ni mensaje.

## Redis

NOT_APPLICABLE. No se añadieron clientes, claves, cache o rate limiting en
Redis.

## RabbitMQ

NOT_APPLICABLE. No se añadieron exchanges, colas, consumidores o eventos.

## Persistencia y PostGIS

NOT_APPLICABLE. No existen cambios de datos, consultas, migraciones, PostGIS o
geocercas.

## Infraestructura y CI/CD

No hubo cambios de infraestructura o pipeline atribuibles a EN-010. No se
recibió evidencia de CI, SAST, SCA, DAST o escaneo de contenedor para el
snapshot; por ello se registran como `NOT_EXECUTED` y no como pruebas pasadas.
La revisión se apoya en inspección manual, pruebas Maven y ejecución local.

## Logs, auditoría y observabilidad

Los mensajes de fallo de configuración y respuestas HTTP no incluyen el valor
del secreto, password, token, cabecera `Authorization`, stack trace ni ruta.
EN-010 no introduce auditoría funcional ni identidades de negocio; correlation
ID, auditoría por usuario/tenant y retención deberán revisarse cuando existan
operaciones autenticadas.

## Riesgos residuales

- El baseline Tomcat 11.0.24 deberá revisarse frente a avisos posteriores a la
  fecha del snapshot.
- El SBOM aún no es consumido por una herramienta SCA dentro de evidencia CI.
- HTTPS, secretos productivos, autenticación real, estrategia de sesión/token,
  hashing, revocación, rate limiting, RBAC, autorización por recurso y
  aislamiento tenant continúan pendientes de sus historias y ADR.
- ADR-010 permanece en estado `Propuesto`; DoF debe aplicar la política del
  repositorio sobre aprobación de decisiones arquitectónicas.
- El Maven Wrapper preexistente no fue utilizable en este host; se empleó Maven
  3.9.6 global con JDK 21. Esta limitación no impidió repetir la suite ni las
  pruebas de seguridad.
- Existían cambios ajenos a EN-010 en contrato funcional, backlog e historias
  Backend. Se preservaron y excluyeron de la aprobación. El alcance pudo
  aislarse mediante rutas, diff y el snapshot lógico.
- El workspace continúa sin commit. Cualquier cambio posterior invalida este
  PASS hasta comparar hashes o ejecutar un retest proporcional.

Ninguno de estos riesgos residuales constituye un hallazgo Critical, High,
Medium o Low abierto dentro del alcance actual.

## Controles no aplicables

No aplican a EN-010: autorización por objeto, BOLA/IDOR, multiempresa,
persistencia, migraciones, PostGIS, geolocalización, mobile, frontend, Redis,
RabbitMQ, WebSocket, import/export, archivos, idempotencia de negocio,
mensajería, Docker productivo y acceso a backups. La razón común es que la
historia no introduce esas superficies ni sus activos.

## Condiciones para nueva revisión

Se requiere nueva revisión de Ciberseguridad si:

1. cambia cualquiera de los 20 archivos del snapshot;
2. el JAR o SBOM deja de coincidir con sus hashes;
3. se modifica la versión efectiva de Spring Security o Tomcat;
4. se agrega `permitAll`, endpoint, usuario, sesión, token o mecanismo de
   autenticación;
5. se cambia la validación, carga o logging del secreto;
6. se integra el backend con tenant, persistencia, Redis, RabbitMQ, WebSocket,
   frontend, mobile o infraestructura productiva;
7. aparece un aviso de seguridad nuevo aplicable al classpath revisado.

El retest debe repetir el caso original de ambos hallazgos, la suite de
seguridad HTTP, los arranques válido/inválido, el árbol de dependencias, la
inspección del JAR/SBOM y el secret scan.

## Trazabilidad a Desarrollo y QA

- Desarrollo entregó `READY_FOR_HANDOFF` y documentó las remediaciones,
  pruebas, dependencias, SBOM y límites.
- QA Backend revalidó después de las remediaciones y emitió `PASS` sobre el
  mismo HEAD y worktree local.
- Ciberseguridad no aceptó esas afirmaciones por sí solas: inspeccionó el diff,
  código, configuración, dependencias, artefactos y evidencia; ejecutó pruebas
  frescas y casos de abuso; cerró ambos hallazgos únicamente tras el retest.
- Este documento transfiere el resultado final a DoF. No declara que DoF haya
  cerrado la historia ni que el workspace esté comprometido en Git.

## Recomendación final

**PASS para EN-010 en el snapshot identificado.**

DoF puede evaluar el cierre de la historia usando este handoff, el PASS de QA y
la evidencia reproducible. Antes del cierre debe confirmar que el snapshot no
cambió, que ADR-010 satisface el proceso arquitectónico aplicable y que el
estado sin commit queda resuelto según el flujo Git del equipo.

