# Security review independiente — EN-012 / H-01

## Estado: PASS

H-01 (Alta) queda cerrado para el worktree sobre `dca1a9c60e6d253dd21eb9190452f5620e2a8355`. La remediación es aplicable a Seguridad porque controla un bootstrap de identidad privilegiada. No quedan hallazgos Critical, High o Medium abiertos.

## Superficie y modelo de abuso

Revisados: historia EN-012, handoff de remediación, QA `PASS`, diff de `PlatformSuperadminBootstrapConfiguration`/`BootstrapCommandActivationTest`, runner, postura HTTP y evidencia de arquitectura. Activos: credenciales iniciales, hash BCrypt, cuenta `PLATFORM_SUPERADMIN` y auditoría. Actores: operador local autorizado, atacante remoto y despliegue servlet mal configurado. Límite de confianza: entorno local -> configuración Spring no-web -> runner/caso de uso -> PostgreSQL.

Abuso reproducido: crear contexto servlet con perfil `bootstrap-superadmin` y `fieldsales.bootstrap.platform-superadmin.enabled=true`, omitiendo el tipo no-web. `@ConditionalOnNotWebApplication` condiciona la clase completa y evita registrar `PlatformSuperadminBootstrapRunner` y `BootstrapPlatformSuperadminUseCase`; el runner conserva además el rechazo defensivo de contexto web antes de leer credenciales.

## Hallazgos y controles

- H-01 — Alta — CERRADO: el bootstrap privilegiado no se compone en servlet aunque perfil y flag coincidan.
- Endpoint/bypass — PASS: el diff no crea controlador, ruta, contrato HTTP ni excepción de autorización; `SecurityConfigurationTest` conserva deny-by-default.
- Secretos/hash/auditoría — PASS: el diff no cambia lectura, hash, persistencia ni auditoría; el runner inspeccionado registra solo operación, resultado y `correlationId`, sin identidad, contraseña ni hash.
- Arquitectura — PASS: la condición permanece en configuración Spring y no cruza capas ni módulos.

## Evidencia

- JDK 21, clases compiladas posteriores a las fuentes y verificadas con `javap` (anotación y prueba servlet presentes): `mvn -o -Dmaven.repo.local=C:\tmp\m2-en012 -Dtest=BootstrapCommandActivationTest,SecurityConfigurationTest,HexagonalArchitectureTest,ModuleBoundaryTest -Dsurefire.useFile=false surefire:test` — **PASS**, 37 pruebas, 0 fallos/errores/omitidas.
- `git diff --check` — **PASS**.
- Suite QA dirigida de EN-012 — **PASS**, 38 pruebas, incluida integración PostgreSQL 17.5.
- Ciclo Maven completo — **NOT_EXECUTED**: `target/classes/application.yaml` estaba bloqueado por otro proceso; no invalida el gate Surefire sobre bytecode vigente ni la evidencia QA del mismo worktree.

## No aplicable y riesgo residual

Tenant/IDOR, sesiones/JWT, ubicación, almacenamiento local, WebSocket, Redis, mensajería, archivos, dependencias e infraestructura son **NOT_APPLICABLE**: no participan en el diff ni existe endpoint de bootstrap.

Riesgo residual bajo: el dictamen corresponde al diff local sin commit; integrar omitiendo la condición o la prueba reabriría H-01. Debe vincularse el handoff al SHA final. La higiene operativa de retirar variables locales tras el one-shot permanece según ADR-012.
