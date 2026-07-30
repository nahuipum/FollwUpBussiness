# Backend Handoff — EN-012

- Historia: `EN-012 — Bootstrap controlado del superadministrador de plataforma`
- Versión: v1.2
- Sprint: S00 — Fundaciones y decisiones
- Dependencias verificadas: EN-010 y EN-011
- Siguiente etapa: QA Backend independiente

## Alcance implementado

- Comando local one-shot para provisionar como máximo una cuenta
  `PLATFORM_SUPERADMIN`.
- Activación mediante tres guardas simultáneas: perfil
  `bootstrap-superadmin`, aplicación no-web y flag explícito habilitado.
- Caso de uso y puertos en `identityaccess`, con dominio libre de Spring, JDBC,
  BCrypt y logging.
- Cuenta de plataforma sin empresa cliente, sin roles adicionales y con
  identidad canónica.
- Reintento idempotente: la misma identidad conserva UUID y hash; una identidad
  distinta produce conflicto sin crear ni elevar otra cuenta.
- Auditoría técnica transaccional con operación, resultado, `correlationId`,
  UUID técnico opcional e instante; no guarda identidad ni material secreto.
- No se agregó endpoint HTTP, operación OpenAPI, registro público, login,
  sesión, JWT, refresh, logout, recuperación, empresa, administrador de empresa,
  rol personalizado, permiso por recurso ni cuenta predeterminada.

Plan ejecutado: decisión arquitectónica y amenazas básicas, modelo y puertos,
migración y adaptadores, activación operativa, pruebas focalizadas/integración,
validación completa y documentación de operador. El agente solicitado
`backend_developer` se utilizó explícitamente para auditar la implementación y
detectar las correcciones de límites hexagonales, límite BCrypt y trazabilidad.
Este handoff no constituye autoaprobación; QA, Ciberseguridad y DoF permanecen
independientes.

### Dominio propietario

`identityaccess` es el único dominio modificado. El dominio modela identidad y
cuenta de plataforma; aplicación orquesta idempotencia mediante puertos; CLI,
JDBC y BCrypt son adaptadores; Spring se limita a configuración/composición. No
hay acceso directo a repositorios de otros dominios ni dependencia de
infraestructura desde dominio/aplicación.

### Contratos actualizados

No se agregó contrato HTTP, evento, WebSocket ni sync. OpenAPI permanece sin
operación de bootstrap de plataforma y una prueba protege esa decisión sin
confundir el endpoint móvil preexistente `/mobile/bootstrap`. Los contratos de
autenticación/sesión siguen reservados para BE-003. El contrato operativo local
queda definido por ADR-012, las variables nombradas y el comando one-shot del
README.

### Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| Mecanismo local controlado y sin endpoint | Triple guarda, runner no-web y OpenAPI sin bootstrap de plataforma | Activación, arranque ordinario y política OpenAPI | Cubierto en Desarrollo; QA pendiente |
| Solo `PLATFORM_SUPERADMIN`, sin empresa | Constante de dominio, servicio e invariantes PostgreSQL | Pruebas de dominio y migración real | Cubierto en Desarrollo; QA pendiente |
| Contraseña solo como hash seguro | BCrypt costo 12 y constraint; texto plano no se registra/persiste | Lector, adapter e integración PostgreSQL | Cubierto en Desarrollo; QA pendiente |
| Segunda ejecución sin duplicar ni elevar | Índices únicos, `ON CONFLICT` y relectura | Reintento secuencial y concurrente | Cubierto en Desarrollo; QA pendiente |
| Auditoría y evidencia reproducible | Registro técnico limitado y transaccional | Runner, auditoría DB y `mvn clean verify` | Cubierto en Desarrollo; QA pendiente |

### Archivos creados y modificados

Archivos de EN-012 creados o actualizados:

- `docs/stories/enablers/EN-012-bootstrap-superadministrador-de-plataforma.md`
- `docs/architecture/adr/ADR-012-bootstrap-superadministrador-plataforma.md`
- `docs/handoffs/backend/EN-012-backend-handoff.md`
- `.env.example`, `.gitignore` y `backend/followupbussiness/README.md`
- `backend/followupbussiness/src/main/resources/application.yaml`
- `backend/followupbussiness/src/main/resources/db/migration/V2__create_identity_access_account_and_bootstrap_audit.sql`
- `identityaccess/domain/model/LoginIdentifier.java`
- `identityaccess/domain/model/PlatformSuperadminAccount.java`
- `identityaccess/application/BootstrapPlatformSuperadminCommand.java`
- `identityaccess/application/BootstrapPlatformSuperadminResult.java`
- `identityaccess/application/BootstrapPlatformSuperadminService.java`
- `identityaccess/application/port/in/BootstrapPlatformSuperadminUseCase.java`
- `identityaccess/application/port/out/BootstrapAuditPort.java`
- `identityaccess/application/port/out/PasswordHashingPort.java`
- `identityaccess/application/port/out/PlatformSuperadminAccountRepository.java`
- `identityaccess/adapter/in/cli/*`
- `identityaccess/adapter/out/persistence/*`
- `identityaccess/adapter/out/security/BCryptPasswordHashingAdapter.java`
- `identityaccess/config/PlatformSuperadminBootstrapConfiguration.java`
- `identityaccess/config/SecurityConfiguration.java`
- pruebas EN-012 bajo `src/test/java/.../identityaccess/` y las políticas
  aplicables de arquitectura, seguridad y secretos.

## ADR y mecanismo de bootstrap

El ADR-012 adopta un comando Spring local y explícito, no un endpoint ni una
migración con credenciales. Solo se registra cuando coinciden perfil y flag; el
runner rechaza un contexto web antes de leer credenciales y el comando de
operador exige además `spring.main.web-application-type=none`. El proceso se
cierra tras una ejecución y el arranque ordinario no registra el runner ni el
caso de uso.

El estado `Propuesto` se conserva deliberadamente porque ADR-010 y ADR-011,
sus predecesores, siguen en ese estado y la aceptación arquitectónica pertenece
a la gobernanza posterior, no a la autoaprobación de Desarrollo. El código y
las pruebas implementan exactamente la decisión propuesta; QA debe señalar una
divergencia si la encuentra.

La estrategia de autenticación, sesión y token continúa reservada para BE-003.
Reejecutar el bootstrap nunca rota el hash ni modifica privilegios. Antes de la
primera creación se pueden sustituir los valores locales; después se requiere
una operación de rotación aprobada en BE-003 o una historia operativa.

## Configuración local requerida

Variables obligatorias del proceso, sin valores ni defaults:

- `FIELD_SALES_BOOTSTRAP_SUPERADMIN_IDENTITY`
- `FIELD_SALES_BOOTSTRAP_SUPERADMIN_PASSWORD`
- `POSTGRES_PASSWORD` para la conexión local ya definida por la línea base.

La contraseña debe tener al menos 16 caracteres, no contener whitespace en los
extremos, no coincidir con placeholders públicos y ocupar como máximo 72 bytes
UTF-8. El error por ausencia o regla incumplida menciona únicamente el nombre de
variable/regla. `.env.example` deja vacíos los dos campos de bootstrap. El
operador crea `.env` local con `Copy-Item .env.example .env`, lo edita sin
imprimir valores, importa las variables con el procedimiento no-printing del
README y elimina ambos valores al terminar.

## Datos y migraciones

`V2__create_identity_access_account_and_bootstrap_audit.sql` crea:

- `identity_access_account`, con FK al catálogo estable EN-011, identidad
  canónica, hash BCrypt costo 12, rol, empresa nullable e instante;
- índice parcial único que permite un solo `PLATFORM_SUPERADMIN`;
- restricciones que obligan `company_id IS NULL` para plataforma y evitan hash
  no BCrypt o rol/ámbito incoherente;
- `identity_access_bootstrap_audit`, limitada a la operación y resultados
  permitidos, con índice por `correlation_id`.

Flyway aplica V1, V2 y el seed repetible de EN-011 desde una base limpia. El
reintento concurrente usa restricciones de PostgreSQL e `INSERT ... ON CONFLICT
DO NOTHING` seguido de relectura. El hash y la auditoría se persisten dentro de
la misma transacción.

## Seguridad

### Seguridad y aislamiento multiempresa

- BCrypt con factor 12; se valida el límite de 72 bytes antes del hash, incluidos
  caracteres multibyte.
- Las copias mutables controladas por el caso de uso y el adaptador se limpian
  en `finally`. La variable de entorno y la API de BCrypt implican objetos
  inmutables administrados por la JVM; la garantía comprobada es que el texto
  plano no se registra ni se persiste.
- Los logs del runner contienen solamente `operation`, `result` y
  `correlationId` generado por servidor.
- La identidad completa, contraseña, hash, tokens, headers y payloads no se
  registran ni forman parte de la auditoría.
- La identidad, el rol y la empresa no provienen de HTTP. El rol es constante
  de dominio `PLATFORM_SUPERADMIN` y la empresa siempre es nula.
- No existe endpoint de bootstrap; Spring Security conserva deny-by-default.
- `.env`, variantes locales, claves y keystores siguen ignorados. La corrección
  `/out/` en `.gitignore` evita ignorar accidentalmente los paquetes
  hexagonales `port/out` y `adapter/out`.

## Pruebas y comandos reproducibles

### Pruebas agregadas

Matriz principal:

| Evidencia requerida | Prueba |
|---|---|
| Bootstrap con entradas locales válidas | `requiredLocalValuesAreReadWithoutBindingOrDefaults`, `controlledExecutionPersistsSafeHashPlatformRoleNoCompanyAndSafeAudit` |
| Falla segura por variable ausente | `missingIdentityFailsWithSafeVariableOnlyMessage`, `missingPasswordFailsWithoutEchoingIdentity` |
| Hash seguro sin texto plano | `bcryptHashMatchesOriginalPasswordAndPlaintextIsNeverStored`, restricciones V2 |
| Único rol de plataforma | `controlledExecutionPersistsSafeHashPlatformRoleNoCompanyAndSafeAudit`, índice parcial único |
| Sin empresa cliente | `controlledExecutionPersistsSafeHashPlatformRoleNoCompanyAndSafeAudit`, check constraint V2 |
| Segunda ejecución idempotente | `retryKeepsSingleAccountAndOriginalHash`, `secondExecutionIsIdempotentAndNeverRotatesTheHash` |
| Reintento concurrente | `concurrentRetryCreatesExactlyOnePrivilegedAccount` |
| Sin endpoint HTTP/OpenAPI | `openApiContainsNoPlatformSuperadminBootstrapOperation`, matriz deny-by-default |
| Activación explícita/no automática | `profileAloneDoesNotRegisterBootstrapCommand`, `flagAloneDoesNotRegisterBootstrapCommand`, `profileAndFlagRegisterBootstrapCommand`, `ordinaryStartupDoesNotRegisterBootstrapCommand` |
| Logs/fallos sin secretos | `nonWebExecutionLogsOnlySafeAuditFields`, `unexpectedFailureIsSanitizedWithoutCauseOrSensitiveMarkers`, `RepositorySecretsPolicyTest` |
| Límites hexagonales | `HexagonalArchitectureTest`, `ModuleBoundaryTest` |
| Base limpia y migraciones | `PlatformSuperadminBootstrapMigrationTest`, PostgreSQL 17.5 Testcontainers |

### Instrucciones de reproducción

Procedimiento desde el repositorio. Los valores se completan únicamente en el
archivo local ignorado y no deben pegarse en shell history, documentación o
evidencia:

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
Set-Location backend\followupbussiness
.\mvnw.cmd clean verify
java -jar target\followupbussiness-0.0.1-SNAPSHOT.jar `
  --spring.profiles.active=bootstrap-superadmin `
  --spring.main.web-application-type=none `
  --fieldsales.bootstrap.platform-superadmin.enabled=true
```

Comprobaciones de repositorio:

```powershell
git check-ignore -v --no-index -- .env .env.local secrets/local.key local-secrets/operator.p12
git check-ignore --no-index -- backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/port/out/PasswordHashingPort.java
git ls-files -- .env '*.pem' '*.key' '*.p12' '*.jks' 'secrets/**' 'local-secrets/**'
```

### Comandos ejecutados

| Comando/control ejecutado | Resultado |
|---|---|
| `mvn clean verify` con JDK 21 y Docker disponibles | `BUILD SUCCESS`; 97/97 pruebas |
| Suite focalizada de activación | 3 pruebas: perfil solo/flag solo no activan; ambos activan |
| Testcontainers PostgreSQL 17.5 | V1, V2 y seed repetible; 6 pruebas EN-012 de persistencia |
| `git check-ignore` para secretos locales | rutas sensibles ignoradas |
| `git check-ignore` para `port/out` y `adapter/out` | exit 1; fuentes no ignoradas |
| `git ls-files` para extensiones/rutas sensibles | 0 archivos trackeados |
| inspección `jar tf` | runner, caso de uso y V2 presentes en el JAR |
| `git diff --check` del alcance versionado | exit 0 |

Evidencia reproducida el 2026-07-30:

- JDK 21.0.9, Maven `clean verify`: `BUILD SUCCESS`.
- 97 pruebas; 0 failures, 0 errors, 0 skipped.
- PostgreSQL 17.5 real mediante Testcontainers: V1, V2 y seed repetible
  aplicados; creación, hash, ámbito, auditoría, idempotencia, concurrencia y
  constraints en verde.
- JAR y SBOM CycloneDX con 58 componentes generados.
- SHA-256 JAR: `1460009F85F068F7BE7B0C6D68E3CA85B837446ED789D8B234933F147EEEC7DF`.
- SHA-256 V2: `D3186D3313F89898B35FD2399EF3C6D8BF83B9ACF880D2C812B95C6CBF81FFC9`.
- `.env.example`: nombres presentes y ambos valores de bootstrap vacíos.
- `git check-ignore`: secretos locales ignorados; los paquetes `port/out` y
  `adapter/out` no están ignorados.
- `git ls-files` sobre extensiones/rutas sensibles: 0 archivos.
- No se dispone de ejecución CI remota en este workspace; la evidencia anterior
  es local, fresca y reproducible con el mismo comando de verificación.
- El comando `java -jar` completo no se ejecutó manualmente contra un entorno
  persistente durante este handoff. Sus partes se verificaron mediante pruebas
  del lector/runner/configuración y una integración real de servicio, JDBC,
  Flyway y PostgreSQL; QA debe ejecutar el recorrido operacional integral.

## Documentación y rollback

El README de backend documenta requisitos, creación del `.env`, importación sin
impresión, arranque de PostgreSQL, verify, comando one-shot, resultados
`CREATED`/`ALREADY_PROVISIONED`/conflicto, consulta segura, retiro de variables,
rotación y límites hasta BE-003/BE-007/BE-057.

Rollback operativo: no activar perfil/flag y retirar las variables del proceso
y del archivo local ignorado. Antes de aplicar V2 pueden retirarse los artefactos
EN-012. Después de aplicar V2 no se edita ni elimina la migración: se crea una
migración forward que preserve la auditoría y compruebe que historias posteriores
no dependan del esquema. Una cuenta creada no se borra ni se rekeyea al reintentar;
requiere procedimiento operativo aprobado.

## Riesgos residuales

### Pendientes conocidos

- BE-003 debe implementar autenticación y definir sesión/token, bloqueo,
  desactivación y rotación persistida; EN-012 por sí solo no permite login.
- BE-057 debe extender el modelo para administradores asociados a empresa sin
  debilitar las restricciones de ámbito.
- BE-007 debe implementar asignación administrativa y permisos; EN-012 no
  introduce autorización funcional.
- Las variables pueden permanecer en el entorno o archivo local si el operador
  omite retirarlas; el procedimiento documenta su eliminación.
- Gestión productiva de secretos, cifrado operativo y despliegue/CI remoto
  permanecen fuera de alcance.
- QA Backend, Ciberseguridad y DoF deben revisar de forma independiente. No hay
  autoaprobación de Desarrollo.

### Recomendación para QA

Ejecutar el comando one-shot completo sobre una base aislada y valores efímeros
inyectados sin imprimirlos; verificar salida `CREATED`, cierre del proceso,
consulta segura, segundo recorrido `ALREADY_PROVISIONED`, conflicto con otra
identidad, ausencia de listener HTTP y limpieza posterior de variables. Repetir
la matriz de logs y comprobar que ningún valor inyectado aparece en consola,
reportes, auditoría o archivos versionados.

## Estado

READY_FOR_HANDOFF
