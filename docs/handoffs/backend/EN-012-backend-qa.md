# QA Backend independiente — EN-012

## Estado: PASS

**Alcance revisado:** commit `5233521136e763f05a285cff2b57e1d7ee7974c5`, ancestro de `feature/be-003-authenticate` (`dca1a9c` es el HEAD indicado). Worktree limpio antes de este handoff. Se revisaron primero las pruebas EN-012, después la implementación, V1/V2, ADR-012 y las reglas funcionales citadas.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia independiente | Estado |
|---|---|---|---|
| Mecanismo local controlado, sin endpoint | Configuración por perfil+flag+`@ConditionalOnNotWebApplication`; runner CLI defensivo; OpenAPI sin operación privilegiada | `BootstrapCommandActivationTest` confirma que, con perfil+flag, el contexto servlet no registra runner ni use case; `BootstrapOpenApiPolicyTest` y `SecurityConfigurationTest` pasan. | PASS |
| Solo `PLATFORM_SUPERADMIN`, sin empresa/tenant cliente | `PlatformSuperadminAccount`, servicio y constraints de V2; cuenta de plataforma es correctamente ajena a tenant | `PlatformSuperadminBootstrapMigrationTest` valida rol, `company_id IS NULL`, FK e invariantes | PASS |
| Sin texto plano; BCrypt 12; sin secretos en evidencia | Reader valida límites (incluidos 72 bytes UTF-8); adaptador BCrypt 12; V2 exige formato; auditoría limitada | tests del reader/runner, persistencia y política de secretos | PASS |
| Idempotencia, conflicto y carrera | Consultas previas, `INSERT ... ON CONFLICT DO NOTHING`, relectura y transacción | servicio + PostgreSQL real: retry, identidad distinta y dos solicitudes concurrentes | PASS |
| Auditoría segura, migraciones y arquitectura | Puerto de auditoría/JDBC dentro de transacción; V1/V2/seed Flyway; capas `identityaccess` | migración limpia PostgreSQL 17.5; `HexagonalArchitectureTest`, `ModuleBoundaryTest`; auditoría no contiene identidad/hash/contraseña | PASS |
| Permisos y aislamiento multiempresa aplicables | No se expone operación HTTP ni se recibe rol/tenant desde cliente; Security deny-by-default | `SecurityConfigurationTest` y OpenAPI: PASS. Autorización por recurso y tenantId: NOT_APPLICABLE, pues EN-012 solo crea cuenta de plataforma sin empresa y no tiene endpoint. | PASS / NOT_APPLICABLE |

## Hallazgos

Sin hallazgos abiertos. H-01 (Alta) queda corregido: `@ConditionalOnNotWebApplication` se aplica a `PlatformSuperadminBootstrapConfiguration`, antes de componer reader, puertos, use case o runner. La prueba `profileAndFlagDoNotRegisterBootstrapCommandInServletContext` confirma, con perfil y flag, la ausencia tanto de `PlatformSuperadminBootstrapRunner` como de `BootstrapPlatformSuperadminUseCase` en contexto servlet. En contexto no-web, `profileAndFlagRegisterBootstrapCommand` conserva la activación; perfil o flag aislados siguen sin hacerlo. El rechazo del runner frente a un `WebApplicationContext` se conserva como defensa en profundidad.

## Comandos y evidencia

| Comando | Resultado |
|---|---|
| `git merge-base --is-ancestor 5233521 HEAD` | exit 0; commit objetivo presente en la rama revisada |
| `git diff --check 5233521^..5233521 -- backend/followupbussiness` | exit 0 |
| JDK 21 + `mvn -Dmaven.repo.local=C:\tmp\m2-en012 -Dtest=BootstrapPlatformSuperadminServiceTest,BootstrapSuperadminCredentialsReaderTest,PlatformSuperadminBootstrapRunnerTest,BootstrapCommandActivationTest,BootstrapOpenApiPolicyTest,HexagonalArchitectureTest,ModuleBoundaryTest,RepositorySecretsPolicyTest,DependencySecurityPolicyTest,PlatformSuperadminBootstrapMigrationTest test` | BUILD SUCCESS; 38 pruebas, 0 fallos/errores/omitidas; PostgreSQL 17.5 Testcontainers aplicó V1, V2, V3 y seed repetible |

Se utilizó Maven directo porque el wrapper no pudo iniciarse en este entorno; el repositorio Maven quedó fuera del backend (`C:\tmp\m2-en012`). No se reutilizó CI remota: no hay evidencia CI verificable del commit en el workspace.

## Regresión relevante y riesgos residuales

Las pruebas de activación servlet/no-web, migración, concurrencia, secretos, OpenAPI, seguridad y límites hexagonales pasan. La configuración no crea endpoint ni beans de bootstrap en servlet; por tanto, el bootstrap solo compone su mecanismo con las tres guardas operativas. Gestión productiva de secretos, autenticación/sesiones y autorización por recurso permanecen fuera de alcance de EN-012, sin bloquear este enabler.
