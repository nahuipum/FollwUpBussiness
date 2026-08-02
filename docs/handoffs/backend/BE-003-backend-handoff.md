# BE-003 — Backend handoff

## Estado

READY_FOR_HANDOFF.

## Alcance

Login de credenciales con estado de cuenta, empresa activa consultada mediante
`CompanyAccessStatusQuery`, familia de sesión y JWT RS256. El tenant y rol se
derivan exclusivamente de la cuenta persistida. El rate limit usa Redis de forma
atómica, claves HMAC sin identificadores en claro y falla cerrada con
`Retry-After`. La renovación queda para BE-004.

## Archivos y contratos

- `backend/followupbussiness/src/main/resources/db/migration/V5__extend_identity_access_accounts_and_create_session_families.sql`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/application/LoginService.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/LoginRateLimiter.java`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/LoginConfiguration.java`
- Puertos/adaptadores de cuenta, sesión, token RS256 y origen WEB en `identityaccess`.
- `docs/api/openapi.yaml` y `docs/architecture/adr/ADR-008-autenticacion-sesiones.md` se preservan.

## Criterios y seguridad

- Credenciales activas crean una familia de sesión y access JWT de 10 minutos.
- Cuenta inactiva, perfil incompleto, contraseña inválida o empresa inactiva retornan el mismo `401 AUTHENTICATION_FAILED`.
- WEB exige `Origin` exactamente igual a la propiedad requerida `field-sales.authentication.web-origin`; MOBILE rechaza contexto navegador.
- WEB no expone refresh en JSON; MOBILE recibe refresh/ticket en JSON. Respuestas de credenciales usan `no-store`.
- Redis no disponible devuelve `503 AUTH_RATE_LIMIT_UNAVAILABLE` con `Retry-After`; cuota agotada devuelve `429 AUTH_RATE_LIMITED` con el TTL restante.
- La configuración inyecta la clave HMAC al adaptador; este no depende de `AuthenticationProperties`.
- El bootstrap controlado exige nombre visible y correo mediante variables de entorno y completa solo un perfil histórico ausente; un perfil incompleto se rechaza de forma neutral.
- MockMvc cubre login exitoso WEB (cookie HttpOnly y CSRF sin refresh en body) y MOBILE (refresh/ticket sin cookie); Flyway cubre perfil y familia de sesión V5.
- Una identidad compartida por más de una empresa se rechaza neutralmente, sin seleccionar un tenant por orden de filas ni aceptar tenant del cliente. Las rutas inexistentes, ambiguas o con estado no utilizable ejecutan una comparación BCrypt dummy.
- `LoginRequest` valida máximo 254 caracteres de identificador, 200 de contraseña y 120 de dispositivo; propiedades JSON extra se rechazan con el binding Jackson de Boot. El filtro limita a 4096 bytes tanto cuerpos declarados como streams chunked/desconocidos, y responde `413 application/problem+json`, `no-store` y `X-Correlation-Id`.
- Los errores de binding y Bean Validation de `LoginController` se interceptan antes del resolvedor por defecto: no incluyen ni registran valores rechazados de credenciales y devuelven un Problem Detail neutro `VALIDATION_FAILED`; el advice no modifica otros endpoints.

## Verificación

Con JDK 21.0.9 y Testcontainers:

`mvn -Dmaven.repo.local=C:/tmp/field-sales-be003-m2 -Dtest=HexagonalArchitectureTest,ModuleBoundaryTest,*Login*,Rs256AccessTokenAdapterTest,SecurityConfigurationTest,PlatformSuperadminBootstrapMigrationTest,AuthenticationContractPolicyTest,BootstrapOpenApiPolicyTest,BootstrapSuperadminCredentialsReaderTest,PlatformSuperadminBootstrapRunnerTest,BootstrapPlatformSuperadminServiceTest test`

La regresión focalizada actual pasó con 77 pruebas, incluyendo el cap de stream,
binding Jackson real de Boot, arquitectura, MockMvc, RS256, seguridad y
Flyway/Testcontainers. La suite completa con JDK 21 ejecutó 163
pruebas: BE-003, arquitectura y migraciones pasaron; seis errores ajenos en
`RouteEngineDecisionPolicyTest` impidieron el PASS global porque ese test exige
un directorio `.git`, mientras este worktree tiene el archivo `.git` de un
worktree enlazado. `git diff --check`: PASS.

## Riesgo residual y reproducción

QA/Security debe ejecutar integración con Redis real y comprobar cookies/headers/canales bajo cuota agotada y caída de Redis. Reproducir con el comando anterior; configurar las propiedades RS256, HMAC, Redis y `web-origin` antes de arrancar login.
