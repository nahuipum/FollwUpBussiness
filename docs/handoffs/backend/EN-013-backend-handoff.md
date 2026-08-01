## Backend Handoff — EN-013

### Estado

READY_FOR_HANDOFF

La decisión y el contrato quedan listos para revisión independiente. Este estado no aprueba la consumibilidad por Frontend, Mobile, QA o Ciberseguridad y no autoriza implementar BE-003 a BE-006 hasta completar esas puertas.

### Alcance implementado

- ADR completo para autenticación, renovación, revocación, logout, activación inicial y recuperación.
- Access JWT RS256 de 10 minutos, refresh opaco de 30 días y tolerancia de reloj de 60 segundos.
- Familias con rotación transaccional, ventana concurrente de 5 segundos, detección de reutilización y revocación inmediata.
- Primer acceso sin registro público, contraseña predeterminada ni autoridad suministrada por el token.
- Activación opaca de un uso por 24 horas y recuperación opaca de un uso por 30 minutos.
- Canales WEB/MOBILE explícitos y resistentes a downgrade: WEB usa cookie HttpOnly + CSRF; MOBILE usa body solo sin contexto navegador y secure storage.
- CORS allowlist, rate limiting, errores consumibles, auditoría segura, observabilidad, persistencia/cache, despliegue y rollback.
- OpenAPI y trazabilidad actualizados; prueba automatizada de invariantes contractuales.

No se implementaron endpoints, migraciones, clases Java de producción, pantallas, proveedor de notificaciones ni alcance de BE-003 a BE-006.

### Dominio propietario

`identityaccess` (`identity-access` en la documentación arquitectónica).

Dominios secundarios futuros: `audit` mediante puerto público y `notifications` mediante el contrato que defina EN-017. No se creó acceso directo entre repositorios.

### Archivos creados y modificados

#### Creado

- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/AuthenticationContractPolicyTest.java`
- `docs/handoffs/backend/EN-013-backend-handoff.md`

#### Modificados

- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md`
- `docs/api/openapi.yaml`
- `docs/api/README.md`
- `docs/api/TRACEABILITY.md`

`jira/` y `tools/` ya eran directorios no rastreados y se preservaron sin cambios.

### Contratos actualizados

- `/auth/login`: selección WEB/MOBILE validada, respuesta discriminada y refresh web solo en `Set-Cookie`.
- `/auth/refresh`: cookie+CSRF para WEB, body opaco obligatorio para MOBILE, sin canje cruzado de canal.
- `/auth/logout`: `allSessions=false` revoca `sid`; `true` revoca todas las familias de la cuenta/tenant; ambos son idempotentes.
- `/auth/password-recovery-requests`: `202` neutral, sin token ni estado de cuenta.
- `/auth/password-resets`: activación/reset de un uso, revocación total tras reset y errores inválido/expirado diferenciados.
- Errores de access, refresh, reset, CSRF, canal, rate limit y degradación definidos como `application/problem+json` con códigos estables.
- `WebAuthenticationResponse` no contiene `refreshToken`; `MobileAuthenticationResponse` sí lo contiene y exige almacenamiento seguro.

No existe API desplegada que romper: los endpoints siguen fuera de implementación. Cualquier cambio posterior incompatible requiere nuevo ADR y transición.

### Datos y migraciones

EN-013 no aplica una migración porque la historia excluye implementación. ADR-008 define la migración forward-only que deberán crear BE-003 a BE-006 sin modificar V1/V2:

- evolución segura de `identity_access_account` para estado, versión de credencial e invitados sin password utilizable;
- `identity_access_session_family` con cuenta, tenant/plataforma, canal, cliente, expiración y revocación;
- `identity_access_refresh_token` con digest HMAC, padre/sucesor y consumo;
- `identity_access_action_token` con propósito, digest, expiración, consumo e invalidación;
- PostgreSQL como fuente de verdad y Redis solo para cache/rate limits con claves segregadas.

El despliegue previsto incluye claves/secretos fuera del repositorio, migración y backfill, endpoints cerrados por flag, habilitación gradual y rollback por deshabilitación + migración compensatoria. Una migración aplicada nunca se edita ni elimina.

### Seguridad y aislamiento multiempresa

- `tenantId`, rol e identidad se derivan de relaciones persistidas; headers, body, token de acción y `clientInstanceId` no conceden autoridad.
- JWT no contiene PII; refresh y tokens de acción se almacenan solo como HMAC-SHA-256.
- Revocación se comprueba en cada request mediante cache respaldada por PostgreSQL; un fallo Redis no reactiva sesiones.
- Una petición con `Origin` o `Sec-Fetch-*` no puede declarar MOBILE para recibir refresh en body.
- CORS usa allowlist exacta sin `*` con credenciales; WEB exige cookie `__Host-fs-refresh` Secure/HttpOnly/SameSite=Strict y CSRF.
- Login y solicitud de recuperación son neutrales contra enumeración.
- Reset exitoso, bloqueo, suspensión, reutilización y logout global revocan el alcance definido.
- Logs/auditoría excluyen password, JWT, refresh, token de acción, cookie, CSRF, `Authorization`, digests y payloads completos.
- Rate limits exactos, `Retry-After` y fallo cerrado del limitador quedan documentados.

No se identificó un riesgo Critical o High sin tratamiento dentro del alcance documental. Ciberseguridad debe validar de forma independiente antes de implementar o liberar los flujos.

### Pruebas agregadas

`AuthenticationContractPolicyTest` agrega cinco pruebas:

1. formato/duraciones, rotación y revocación inmediata;
2. rechazo de downgrade navegador→MOBILE en ADR y OpenAPI;
3. ausencia de refresh en schema web y presencia solo en mobile;
4. errores de expiración/rotación/reutilización/reset consumibles sin enumeración;
5. ausencia de registro público/password predeterminada y tokens de acción de un uso.

La suite completa también revalidó arquitectura hexagonal, límites modulares, seguridad deny-by-default, secretos, dependencias y migraciones V1/V2 en PostgreSQL 17.5 real mediante Testcontainers.

### Comandos ejecutados

| Comando | Resultado | Evidencia relevante |
|---|---|---|
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` (primera pasada) | Exit 0; válido con 1 warning | Detectó `RateLimited` sin uso después de especializar respuestas auth; se eliminó. |
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` (final) | Exit 0; válido, 0 errores y 0 warnings | `Woohoo! Your API description is valid.` |
| `mvn "-Dtest=AuthenticationContractPolicyTest" test` (durante aplicación coordinada) | Build exitoso, 0 tests | El archivo aún era placeholder; resultado descartado y no usado como evidencia. |
| `mvn "-Dtest=AuthenticationContractPolicyTest" test` (final, JDK 21) | `BUILD SUCCESS`; 5/5 | 0 fallos, 0 errores, 0 omitidas. |
| `mvn clean verify` (JDK 21) | `BUILD SUCCESS`; 102/102 | 0 fallos/errores/omitidas; PostgreSQL 17.5 Testcontainers, V1/V2+seed, ArchUnit, JAR y SBOM CycloneDX 1.6 con 58 componentes. |
| `git diff --check` | Exit 0 | Sin errores de whitespace. Los avisos LF→CRLF corresponden a configuración Git del host. |

`mvn clean verify` mostró warnings preexistentes no bloqueantes de carga dinámica futura de Mockito/ByteBuddy y keywords de validación del plugin CycloneDX; no hubo fallo de build ni dependencia nueva en EN-013.

### Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| 1. Formato y duración de credenciales | JWT RS256 10 min; refresh opaco 32 bytes/43 chars y familia absoluta 30 días | ADR-008; OpenAPI `AccessCredentials` y schemas mobile | CUBIERTO |
| 2. Rotación, revocación, logout y robo/reutilización | CAS transaccional, ventana 5 s, `409` rotado, `401` reutilizado, revocación inmediata, logout actual/global | ADR-008; `/auth/refresh`; `/auth/logout`; prueba contractual | CUBIERTO |
| 3. Primer acceso seguro | Cuenta `INVITED`, activación opaca 24 h, sin password predeterminada ni `/register` | ADR-008; `/auth/password-resets`; prueba contractual | CUBIERTO |
| 4. Recuperación neutral de un uso | `202` uniforme; token opaco HMAC, 30 min, un uso; inválido `400`, expirado `410` | ADR-008; recovery/reset OpenAPI; prueba contractual | CUBIERTO |
| 5. Almacenamiento, CSRF, rate limit, auditoría y rollback | Web cookie HttpOnly+CSRF, mobile secure storage, allowlist CORS, límites, logs seguros, datos/deploy/rollback | ADR-008; OpenAPI; README/TRACEABILITY | CUBIERTO |
| 6. Consumibilidad multidisciplinaria antes de BE-003..006 | Contrato preparado y puerta explícita cerrada hasta revisión | Este handoff y sección “Puertas pendientes” de TRACEABILITY | LISTO_PARA_REVISIÓN; APROBACIONES PENDIENTES |

### Riesgos residuales

- XSS aún puede usar el access token en memoria durante hasta 10 minutos; CSP y controles frontend deben revisarse.
- Un dispositivo comprometido puede extraer secretos pese a Keychain/Keystore.
- La ventana concurrente de 5 segundos requiere pruebas de carrera y abuso en la implementación real.
- Gestión productiva de claves, TLS/WAF y retención de auditoría pertenecen a operación/infraestructura posterior.
- El schema OpenAPI expresa requisitos condicionales WEB/MOBILE mediante descripciones, headers y schemas separados; los generadores de clientes deben conservar esas restricciones en wrappers tipados.

### Pendientes conocidos

- Aprobación independiente de consumibilidad por Frontend, Mobile y QA de contrato.
- Revisión de Ciberseguridad sobre robo/reutilización, CSRF/CORS, enumeración, rate limiting y aislamiento.
- Decisión de proveedor/canal de notificación en EN-017.
- Implementación de tablas, claves, endpoints y controles en BE-003 a BE-006 después de las aprobaciones.
- QA/Seguridad/DoF deciden PASS/cierre; este handoff no los sustituye.

### Instrucciones de reproducción

Desde la raíz del repositorio:

```powershell
npx --yes @redocly/cli lint docs/api/openapi.yaml

$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
Set-Location backend\followupbussiness
mvn "-Dtest=AuthenticationContractPolicyTest" test
mvn clean verify
Set-Location ..\..
git diff --check
```

Requiere JDK 21 y Docker disponible para la suite completa con Testcontainers. No requiere secretos nuevos ni levanta endpoints EN-013.

### Recomendación para QA

1. Ejecutar lint y la prueba contractual focalizada.
2. Generar clientes web/mobile desde OpenAPI y confirmar que `WebAuthenticationResponse` no expone `refreshToken`.
3. Diseñar casos negativos para Origin/`Sec-Fetch-*` + MOBILE, body web, cookie mobile, CSRF ausente, rotación concurrente y reutilización fuera de ventana.
4. Validar códigos `ACCESS_TOKEN_EXPIRED`, `REFRESH_ALREADY_ROTATED`, `REFRESH_TOKEN_REUSED`, `PASSWORD_RESET_TOKEN_INVALID` y `PASSWORD_RESET_TOKEN_EXPIRED` sin depender del texto.
5. Confirmar que `allSessions` y reset revocan el alcance correcto sin cruce de tenant cuando exista implementación.
6. Mantener BE-003 a BE-006 bloqueadas hasta que Frontend, Mobile, QA y Ciberseguridad registren consumibilidad.

### Estabilización de candidato — 2026-07-31

- **Snapshot revisable:** `adec7be3ec673ff9681a517a1d11f10ed0781c28` sobre la base funcional EN-013 `4987f5eef7c9310b5a8ed4aa2c08f96d71b6de24` (base previa `5233521136e763f05a285cff2b57e1d7ee7974c5`). El cambio original compartió EN-013 y EN-014; la revisión se limita a los materiales EN-013 enumerados aquí.
- **Delta posterior:** entre `4987f5e..adec7be`, ADR-008 y este handoff no cambian. `docs/api/openapi.yaml` solo añade una regla ajena de proveedor y el test EN-013 solo sustituye `Files.isDirectory(.git)` por `Files.exists(.git)`, compatible con worktrees; no modifica ninguna aserción de autenticación ni contrato `/auth/*`.
- **Worktree al revisar:** modificaciones ajenas limitadas a `.gitignore`, `AGENTS.MD` y `.codex/`; no se atribuyen a EN-013. `git diff --check` termina con código 0 (los avisos LF→CRLF son del host).
- **Huella SHA-256 del candidato:** ADR-008 `4A640A6BE7D37D5B6BED1C869A3C48953332E83F681DAE1EA2CAC85526BA9102`; OpenAPI `95E8055CD325E1F3F63B52D5C02B52D952764177F2808C325425F79DF43ADA4B`; prueba `69582F8DF3A28BC5C93C49177E2D96B9E7A1CE42C51EB43B914BE6DED7496785`.
- **Verificación actual:** con JDK 21.0.9, `mvn "-Dtest=AuthenticationContractPolicyTest" test` finalizó `BUILD SUCCESS`, 5 pruebas, 0 fallos/errores/omitidas. `npx --yes @redocly/cli lint docs/api/openapi.yaml` finalizó con código 0. No se repitió `mvn clean verify`: no hubo delta EN-013 funcional y la evidencia previa del handoff ya lo cubre.

Reproducción de la estabilización:

```powershell
git rev-parse HEAD
git diff --name-status 4987f5e..HEAD -- docs/architecture/adr/ADR-008-autenticacion-sesiones.md docs/api/openapi.yaml docs/handoffs/backend/EN-013-backend-handoff.md backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/AuthenticationContractPolicyTest.java
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
Set-Location backend\followupbussiness
mvn "-Dtest=AuthenticationContractPolicyTest" test
Set-Location ..\..
npx --yes @redocly/cli lint docs/api/openapi.yaml
git diff --check
```

READY_FOR_HANDOFF
