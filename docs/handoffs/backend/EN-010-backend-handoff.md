# Backend Handoff — EN-010

## Trazabilidad

- Historia: `docs/stories/enablers/EN-010-configurar-spring-security-y-secretos-locales.md`.
- Corrección documental: B-01, reportado por QA por ausencia de un handoff de
  Desarrollo persistente.
- Remediación `SEC-EN010-001`: validación exhaustiva de whitespace en extremos
  y comparación normalizada contra todos los placeholders prohibidos.
- Remediación `SEC-EN010-002`: Tomcat `11.0.24`, prueba de política de
  dependencias y SBOM CycloneDX reproducible.
- Responsable de este documento: Desarrollo Backend.
- Este handoff conserva el estado de Desarrollo `READY_FOR_HANDOFF`; no es una
  aprobación ni sustituye las revisiones independientes de QA, Seguridad y DoF.

## Alcance implementado

- Spring Security incorporado mediante dependencias administradas por Spring
  Boot.
- `SecurityFilterChain` explícita con política `deny by default`.
- Toda solicitud requiere autenticación; no existen excepciones públicas.
- Respuestas JSON genéricas y no cacheables para rechazos `401` y `403`.
- Usuario autogenerado, form login, HTTP Basic y logout deshabilitados.
- Propiedad local obligatoria para validar el canal de inyección de secretos.
- Fallo seguro durante el arranque cuando el secreto falta, es demasiado corto,
  conserva un placeholder público o contiene whitespace en los extremos.
- Comparación en tiempo constante del valor normalizado contra todos los
  placeholders prohibidos, sin registrar el valor.
- Baseline Tomcat `11.0.24` sincronizado para core, EL y WebSocket.
- SBOM CycloneDX 1.6 reproducible generado durante `verify`.
- Patrones Git reforzados para `.env`, secretos locales, claves privadas y
  keystores.
- Pruebas de seguridad, arranque, arquitectura y política de secretos.
- Documentación local de requisitos, arranque, pruebas, limitaciones y rollback.

## Fuera de alcance

Usuarios, login, sesiones, JWT/refresh token, roles funcionales, permisos por
recurso, endpoints de negocio, BE-003, BE-004, BE-005, BE-006, BE-007, secretos
de producción, Vault/KMS, CI/CD, despliegue productivo, frontend, mobile e
infraestructura productiva.

## ADR de seguridad y secretos

`docs/architecture/adr/ADR-010-linea-base-seguridad-secretos-locales.md`
permanece en estado `Propuesto`. Documenta:

- Spring Security como mecanismo de seguridad HTTP;
- política `deny by default`;
- ausencia de endpoints públicos en esta etapa;
- evolución prevista hacia BE-003, BE-004, BE-005 y BE-007;
- inyección y prohibición de versionado de secretos locales;
- respuestas seguras `401`/`403`;
- reserva de la estrategia concreta sesión/token para el ADR de BE-003;
- riesgos, consecuencias y reversión.

## Configuración Spring Security

- `anyRequest().authenticated()` protege rutas existentes, futuras, no mapeadas
  y operativas.
- No se utiliza `permitAll`.
- `/auth/login`, `/auth/refresh` y `/auth/logout` no se habilitaron.
- Health/readiness no se exponen.
- No se configuraron usuarios, cuentas por defecto, roles, permisos, JWT,
  OAuth, autenticación temporal ni bypass.
- Las solicitudes mutables no autenticadas alcanzan la autorización y reciben
  `401`; una solicitud con contexto autenticado que incumple CSRF recibe `403`.
- Los cuerpos no incluyen excepción, stack trace, ruta, configuración, secreto,
  password ni cabecera `Authorization`.

## Gestión local de secretos

- Variable requerida: `FIELD_SALES_SECURITY_LOCAL_SECRET`.
- No existe valor por defecto ni valor secreto en `application.yaml`.
- El valor debe ser no vacío, diferente del placeholder documentado y tener al
  menos 32 caracteres.
- Se rechaza cualquier whitespace Unicode al inicio o al final, incluidos
  espacios, tabulaciones, CR y LF.
- El valor normalizado se compara en tiempo constante contra todos los
  placeholders prohibidos; la evaluación no termina en la primera coincidencia.
- El mensaje de error menciona únicamente el nombre de la variable y la regla
  incumplida; nunca registra el valor.
- `.env.example` contiene placeholders públicos deliberadamente no válidos
  fuera de desarrollo.
- `.env`, variantes locales, directorios de secretos, claves y keystores
  continúan ignorados por Git.
- Este secreto fundacional valida únicamente la entrega de configuración; no
  es password, token, clave de firma ni material criptográfico. BE-003 deberá
  definir los secretos funcionales.

## Archivos creados y modificados

### Creados

- `docs/stories/enablers/EN-010-configurar-spring-security-y-secretos-locales.md`
- `docs/architecture/adr/ADR-010-linea-base-seguridad-secretos-locales.md`
- `docs/handoffs/backend/EN-010-backend-handoff.md`
- `docs/security/EN-010-security-review.md`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/LocalSecuritySecretsProperties.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfiguration.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/RestAuthenticationEntryPoint.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/RestAccessDeniedHandler.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/security/SecurityErrorResponseWriter.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/LocalSecuritySecretsPropertiesTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/SecurityConfigurationTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/RepositorySecretsPolicyTest.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/DependencySecurityPolicyTest.java`

### Modificados

- `.env.example`
- `.gitignore`
- `backend/followupbussiness/pom.xml`
- `backend/followupbussiness/README.md`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/FollowupbussinessApplication.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/FollowupbussinessApplicationTests.java`

No se modificaron OpenAPI, contratos de eventos, WebSocket, sincronización,
datos ni migraciones.

## Pruebas, comandos y evidencia reproducible

Toda la evidencia indicada es evidencia local reproducible. No existe ni se
afirma evidencia de CI para EN-010.

### Suite Maven

Comando ejecutado desde `backend/followupbussiness` con JDK 21:

```powershell
mvn clean verify
```

Resultado final:

- `BUILD SUCCESS`;
- 55 pruebas ejecutadas;
- 0 fallos;
- 0 errores;
- 0 omitidas;
- JAR ejecutable generado;
- SBOM CycloneDX 1.6 generado y validado.

La suite incluye:

- 4 validaciones ArchUnit de arquitectura y límites modulares;
- 25 pruebas de configuración de seguridad y matriz HTTP;
- 19 pruebas de configuración/fallo seguro de secretos;
- 3 pruebas de política de dependencias Tomcat;
- 3 pruebas de política Git y `.env.example`;
- 1 prueba de carga del contexto completo.

La matriz HTTP se repitió de forma aislada con:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn "-Dtest=SecurityConfigurationTest" test
```

Resultado: 25 pruebas, 0 fallos, 0 errores, 0 omitidas y `BUILD SUCCESS`.
Un primer intento dentro del sandbox no pudo resolver el parent Maven por
restricción de acceso, y un segundo intento con el Java 17 predeterminado del
host rechazó bytecode Java 21. La repetición explícita con el JDK 21 requerido
pasó; ninguno de esos intentos modificó código.

### Arranque con secreto local requerido

Se ejecutó el JAR con una variable local de prueba no secreta y
`--server.port=0`.

Resultado:

- la aplicación arrancó correctamente;
- una solicitud `GET /customers` devolvió `401`;
- cuerpo observado:
  `{"status":401,"code":"UNAUTHORIZED","message":"Authentication is required"}`.

### Fallo seguro sin secreto

Se eliminó `FIELD_SALES_SECURITY_LOCAL_SECRET` del entorno del proceso y se
ejecutó el JAR.

Resultado:

- código de salida `1`;
- se encontró el mensaje seguro:
  `FIELD_SALES_SECURITY_LOCAL_SECRET is required; its value was not logged`;
- no se imprimió ningún valor del secreto.

### Dependencias

```powershell
mvn dependency:tree "-Dscope=compile" "-Dincludes=org.springframework.boot:spring-boot-starter-security,org.springframework.security:*"
```

Resultado: Spring Boot Security `4.1.0` y Spring Security `7.1.0` resueltos por
la gestión de dependencias del proyecto.

Para la remediación de `SEC-EN010-002` se ejecutó:

```powershell
mvn help:effective-pom "-Doutput=target/effective-pom-en010.xml"
mvn dependency:tree "-Dincludes=org.apache.tomcat.embed:*"
jar tf target/followupbussiness-0.0.1-SNAPSHOT.jar
rg -a "11\.0\.22" target pom.xml
```

Evidencia:

- el POM efectivo fija `tomcat.version` en `11.0.24`;
- el árbol resuelve `tomcat-embed-core`, `tomcat-embed-el` y
  `tomcat-embed-websocket` en `11.0.24`;
- el JAR contiene únicamente esos tres módulos Tomcat `11.0.24`;
- no existe `11.0.22` en el POM, classpath ni JAR construido.

### SBOM reproducible

`mvn clean verify` generó
`target/sbom/application.cdx.json` mediante CycloneDX Maven Plugin 2.9.1.

Evidencia:

- `bomFormat=CycloneDX`, `specVersion=1.6`;
- 45 componentes;
- sin `serialNumber` aleatorio;
- dos generaciones consecutivas produjeron el mismo SHA-256:
  `EDE5F55B05B788B47621877D5CEBD3ABF96F1379600356C041AD504943D54710`;
- el SBOM enumera Tomcat core, EL y WebSocket en `11.0.24`.

Esta evidencia demuestra inventario reproducible, no una ejecución SCA. No se
afirma evidencia de escaneo de vulnerabilidades ni de CI.

### Git y secretos

```powershell
git check-ignore -v --no-index -- .env backend/followupbussiness/.env.local backend/followupbussiness/secrets-local/runtime.txt backend/followupbussiness/local-signing.key backend/followupbussiness/local-keystore.p12
git diff --check
```

Resultado:

- `.env`, `.env.local`, `secrets-local`, `.key` y `.p12` resuelven reglas de
  `.gitignore`;
- `git diff --check` finaliza con código `0`;
- la prueba `RepositorySecretsPolicyTest` confirma que no hay archivos locales
  de secretos trackeados y que `.env.example` solo contiene los placeholders
  permitidos.

El Maven Wrapper preexistente no inicia en este host por un error interno de su
script PowerShell. No se modificó por estar fuera de EN-010. Maven 3.9.6 global
con JDK 21 ejecutó todas las validaciones; `backend/followupbussiness/README.md`
documenta esa alternativa.

## Documentación

- La historia conserva los textos literales solicitados.
- ADR-010 contiene la decisión y permanece `Propuesto`.
- `docs/security/EN-010-security-review.md` conserva el snapshot de remediación
  de Desarrollo para revisión independiente; no aprueba los hallazgos.
- El README backend documenta requisitos locales, variable requerida sin su
  valor, creación del `.env`, exportación segura al entorno, comandos,
  comportamiento ante secreto faltante, limitaciones hasta BE-003/BE-007 y
  rollback.
- `.env.example` identifica explícitamente sus valores como placeholders
  públicos de desarrollo.

## Riesgos y dependencias posteriores

- BE-003 debe decidir sesión/token, hashing, credenciales reales y revisar la
  regla CSRF.
- BE-004 y BE-005 dependen de la estrategia de sesión/revocación aprobada.
- BE-007 debe implementar tenant, roles y autorización por recurso cuando
  existan sus entidades y relaciones.
- El secreto local fundacional no sustituye gestión de secretos productiva.
- El baseline Tomcat debe actualizarse cuando aparezcan nuevas correcciones
  compatibles; la prueba establece `11.0.24` como mínimo de esta entrega.
- El SBOM debe consumirse por una herramienta SCA en un incremento posterior;
  EN-010 solo demuestra su generación reproducible.
- HTTPS, secretos productivos y despliegue permanecen pendientes.
- La remediación modificó código después de la evidencia QA previa; la
  revalidación independiente de QA, Seguridad y DoF sigue pendiente.

## Rollback

Eliminar las dependencias, override de Tomcat, ejecución CycloneDX,
configuración, handlers y pruebas de EN-010; revertir las adiciones de EN-010
en `.env.example`, `.gitignore`, README, historia, ADR, snapshot de seguridad y
este handoff. La reversión elimina la protección HTTP y solo es segura mientras
no existan endpoints de negocio y el servicio no esté expuesto.

## Estado

Estado de Desarrollo Backend: `READY_FOR_HANDOFF`.

QA, Seguridad y DoF permanecen pendientes. Este documento no declara `PASS` ni
aprueba el trabajo.

READY_FOR_HANDOFF
