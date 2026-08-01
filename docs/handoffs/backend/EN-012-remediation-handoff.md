# Backend remediation handoff — EN-012 / H-01

## Estado

READY_FOR_HANDOFF

## Alcance

Se resolvió H-01 de QA: la configuración del bootstrap de plataforma ahora se
condiciona como no-web antes de componer cualquier bean. Se preserva la defensa
en profundidad del runner ante un contexto web y las guardas existentes de
perfil `bootstrap-superadmin` y flag explícito. No se agregaron endpoints,
contratos HTTP, eventos ni cambios de dominio.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/config/PlatformSuperadminBootstrapConfiguration.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/BootstrapCommandActivationTest.java`
- `docs/handoffs/backend/EN-012-remediation-handoff.md`

## Contratos y migraciones

Sin cambios. Se conserva ADR-012 como contrato operativo local de las tres
guardas. No se creó ni modificó migración Flyway.

## Verificación ejecutada

- JDK 21: `mvn -Dmaven.repo.local=C:\tmp\m2-en012 -Dtest=BootstrapCommandActivationTest test` — PASS, 4 pruebas.
- JDK 21: `mvn -Dmaven.repo.local=C:\tmp\m2-en012 -Dtest=BootstrapPlatformSuperadminServiceTest,BootstrapSuperadminCredentialsReaderTest,PlatformSuperadminBootstrapRunnerTest,BootstrapCommandActivationTest,BootstrapOpenApiPolicyTest,HexagonalArchitectureTest,ModuleBoundaryTest,RepositorySecretsPolicyTest,DependencySecurityPolicyTest,PlatformSuperadminBootstrapMigrationTest test` — PASS, 38 pruebas; incluye PostgreSQL 17.5 mediante Testcontainers y Flyway.
- `git diff --check` — PASS.
- `python -m graphify update .` — PASS; grafo de código actualizado.

## Criterios cubiertos

- Con perfil y flag válidos en un `WebApplicationContext`, no se registran ni
  `PlatformSuperadminBootstrapRunner` ni el puerto de entrada de bootstrap.
- En contexto no-web, perfil y flag siguen registrando el comando.
- Perfil o flag aislados siguen sin activarlo.
- Se conserva el rechazo seguro del runner si llegara a instanciarse contra un
  contexto web por una composición futura incorrecta.
- Se mantienen idempotencia, secreto seguro, auditoría, OpenAPI sin bootstrap,
  migraciones y límites arquitectónicos por la regresión dirigida.

## Riesgos y reproducción

Riesgo residual: la condición se valida mediante `WebApplicationContextRunner`;
QA puede repetir el caso con la aplicación completa para comprobar la misma
composición en su entorno operativo. No hay listener de bootstrap registrable
en contexto servlet porque el runner ya no es bean allí.

Reproducción de H-01 corregida: activar perfil y flag, omitir
`spring.main.web-application-type=none` y crear un contexto servlet; el test
`profileAndFlagDoNotRegisterBootstrapCommandInServletContext` confirma la
ausencia del runner y del caso de uso. La ejecución válida conserva
`--spring.main.web-application-type=none` junto con perfil y flag, según
`docs/architecture/adr/ADR-012-bootstrap-superadministrador-plataforma.md`.
