# Backend Handoff — EN-011 Closure Remediation

## Estado

`READY_FOR_HANDOFF`

La ejecución remota del candidato autorizado cerró la evidencia pendiente de
CI/SCA. Quedan QA y Ciberseguridad independientes; este handoff no los
sustituye.

## Evidencia remota de cierre

- Run GitHub Actions:
  [30601633807](https://github.com/nahuipum/FollwUpBussiness/actions/runs/30601633807),
  attempt `2`, job `91072356994`, concluido `success`.
- Candidato: `7f8a2717a5aa70d101affec202bba0e767add057` en
  `feature/en-011-closure`; digest lógico recalculado:
  `8062754176a5fbc837ddeea1f36636cd4814e1b85a837bd896066d2217f28db6`.
- Artefacto:
  `backend-en011-closure-7f8a2717a5aa70d101affec202bba0e767add057-2.zip`,
  SHA-256
  `C2D06BCC78982EF409453587405582B86CBBA8DFF56891061C65DB77358D892C`;
  descargado en `backend/followupbussiness/target/`.
- Integridad independiente: `deliverables.sha256` verificó `64/64` hashes;
  allowlist cerrada `65/65`, sin rutas ajenas. Retención configurada: 30 días.
- Surefire: 26 reportes, `129` pruebas, `0` fallos, `0` errores y `5`
  omitidas opt-in. SBOM CycloneDX: `58` componentes.
- SCA: Trivy `0.70.0`, base `UpdatedAt`
  `2026-07-31T01:16:01.565726584Z`, observada
  `2026-07-31T04:23:59Z`; `0` vulnerabilidades y gate High/Critical `PASS`.

## Alcance implementado

- ADR-011 aceptado conforme a opción A, con fecha 2026-07-30 y responsabilidad
  institucional del Product Owner por autorización explícita del usuario en la
  orquestación, sin inventar identidad personal.
- Consecuencias, riesgos residuales y condiciones de ADR sustituto.
- Trazabilidad que sustituye el snapshot histórico y exige repetir QA/Seguridad.
- Workflow GitHub Actions con JDK 21, Maven Wrapper, `clean verify`, suite
  focalizada, ArchUnit, Testcontainers, POM efectivo, árbol Maven y SBOM.
- Artefacto GitHub de staging cerrado con retención de 30 días, action fijada
  por SHA, allowlist de rutas, secret scan y manifiesto SHA-256.
- SCA Trivy 0.70.0 separado del inventario SBOM, con metadatos de base, fecha
  UTC, reporte integral y gate High/Critical ejecutados remotamente.
- Estado literal `SAST_CONFIG_MISSING` porque no existe configuración SAST.
- Manifiesto reproducible del snapshot lógico nuevo.

## Dominio propietario

`identityaccess`. No se modificó catálogo, roles, migraciones ni código
funcional del dominio.

## Archivos creados y modificados

### Creados

- `.github/workflows/backend-en011-closure-ci.yml`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/En011ClosurePipelinePolicyTest.java`
- `docs/security/EN-011-sca-policy.md`
- `docs/handoffs/backend/EN-011-closure-remediation-manifest.md`
- `docs/handoffs/backend/EN-011-closure-remediation-handoff.md`

### Modificados

- `docs/architecture/adr/ADR-011-catalogo-roles-base.md`
- `docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md`
- `docs/handoffs/backend/EN-011-backend-handoff.md`

## Contratos actualizados

No aplica cambio REST, eventos, WebSocket o sync. Se actualizan únicamente la
decisión arquitectónica y la trazabilidad EN-011.

## Datos y migraciones

Sin cambios. V1 y el seed repetible conservan sus hashes históricos:
`b4a4b499...1911b5` y `32317cb8...deb87`.

## Seguridad y aislamiento multiempresa

- El catálogo sigue siendo global y no representa asignaciones tenant.
- No se añadió endpoint, sesión, identidad ni autoridad desde el cliente.
- El gate configurado falla ante High/Critical, con o sin fix.
- La base y fecha de Trivy son obligatorias; si faltan, el job falla.
- El artefacto remoto contiene solo JAR, SBOM, POM efectivo, árbol Maven,
  reportes Surefire/Failsafe, evidencia Trivy/base/fecha/gate, estado SAST y
  manifiestos/hash. Excluye `.env`, secretos, variables de entorno, dumps, logs
  no revisados y payloads de negocio.
- QA y Ciberseguridad previos quedan invalidados para este snapshot.

## Pruebas agregadas

`En011ClosurePipelinePolicyTest` verifica build, pruebas, SCA, metadatos de
base/fecha, gate, evidencia, ausencia de secretos, ausencia de `.trivyignore`,
`SAST_CONFIG_MISSING`, allowlist cerrada, action fijada y retención de 30 días.

## Comandos ejecutados

- Comando: `mvnw.cmd ... -Dtest=En011ClosurePipelinePolicyTest test`.
  Resultado: `BUILD SUCCESS`; 3 pruebas, 0 fallos/errores/omitidas.
- Comando: `mvnw.cmd --batch-mode --no-transfer-progress clean verify` con
  JDK 21.0.9.
  Resultado: `BUILD SUCCESS`; 129 pruebas, 0 fallos, 0 errores, 5 spikes live
  opt-in omitidos; JAR y SBOM generados.
- Comando: suite focalizada EN-011 con dominio, seguridad, migración,
  Testcontainers, política CI y arquitectura.
  Resultado: `BUILD SUCCESS`; 47 pruebas, 0 fallos/errores/omitidas;
  PostgreSQL 17.5 sobre `postgis/postgis:17-3.5`, Docker 27.4.0.
- Comando: `help:effective-pom` y `dependency:tree -Dverbose`.
  Resultado: `BUILD SUCCESS`; Java 21, CycloneDX 2.9.1, pgJDBC 42.7.12,
  Jackson Databind 3.1.5, ArchUnit 1.4.2 y Testcontainers 2.0.5.
- Comando: inspección de `target/sbom/application.cdx.json`.
  Resultado: CycloneDX 1.6, 58 componentes, SHA-256
  `60c44eff3afbb6000c5bc9a225e31a991c3bcd20b91cf2043e2c047ca1374895`.
- Comando: `git diff --check`.
  Resultado: código 0; sin errores de whitespace.
- Comando: `npx --yes prettier@3.6.2 --parser yaml` sobre el workflow.
  Resultado: `YAML_PARSE_OK`; sintaxis YAML válida.
- Comando: simulación Git Bash del staging, allowlist, extracción del JAR,
  secret scan y verificación SHA-256; luego inyección negativa de ruta extra y
  token ficticio.
  Resultado: `STRICT_ARTIFACT_POLICY_SIMULATION_OK`; ruta no autorizada y
  secreto ficticio rechazados.
- Evidencia remota: GitHub Actions run `30601633807`, attempt `2`, job
  `91072356994`, sobre el SHA candidato. Resultado: `success`; Trivy 0.70.0
  encontró 0 vulnerabilidades y el gate High/Critical finalizó `PASS`.
- Verificación local de evidencia: hash del ZIP, `deliverables.sha256`,
  allowlist, XML Surefire, SBOM y reportes Trivy. Resultado: hash coincidente;
  `64/64` hashes y `65/65` rutas permitidas; los metadatos del run son
  coherentes con el manifiesto del artefacto.

## Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| ADR-011 aceptado según opción A | Metadatos, decisión y límites explícitos | ADR-011 | Implementado |
| Snapshot anterior sustituido | Historia, handoff histórico y manifiesto nuevo | Digest `80627541...6d2217f28db6` | Implementado |
| CI usa JDK 21, Wrapper y `clean verify` | Workflow dedicado | Run `30601633807` exitoso | Implementado |
| ArchUnit/Testcontainers ejecutables | Suites explícitas | Run remoto y 129 pruebas sin fallos/errores | Implementado |
| SBOM CycloneDX reproducible | Fase Maven verify | 58 componentes verificados | Implementado |
| SCA integral con herramienta/base/fecha/gate | Trivy 0.70.0 ejecutado en CI | Base fechada, 0 vulnerabilidades, gate High/Critical PASS | Implementado |
| SAST no inventado | `SAST_CONFIG_MISSING` | Política y workflow | Implementado |
| Evidencia persistente descargable | Upload allowlisted fijado por SHA, 30 días | Artefacto descargado; 64/64 hashes y 65/65 rutas | Implementado |
| Sin cambios funcionales EN-012/013 | Diff limitado a cierre EN-011 | `git status`/diff | Implementado |

## Riesgos residuales

- QA y Ciberseguridad deben repetir revisión sobre este SHA/digest y el
  artefacto remoto; los PASS históricos no aplican al snapshot nuevo.
- La evidencia remota expira conforme a la retención de 30 días; conservar la
  referencia del run y el ZIP verificado para trazabilidad.

## Pendientes conocidos

1. Repetir QA y Ciberseguridad sobre el SHA/digest y evidencia remota; luego
   solicitar DoF.

## Instrucciones de reproducción

1. Configurar JDK 21 y Docker.
2. Desde `backend/followupbussiness`, ejecutar
   `.\mvnw.cmd --batch-mode --no-transfer-progress clean verify`.
3. Ejecutar la suite focalizada declarada en el workflow.
4. Recalcular el digest con el algoritmo del manifiesto.
5. Descargar el artefacto del run, verificar SHA-256,
   `deliverables.sha256` y la allowlist; comprobar Trivy, base, fecha y gate
   High/Critical. Confirmar la retención de 30 días del workflow.

## Recomendación para QA

No reutilizar el handoff QA anterior. Validar independientemente el SHA/digest,
ADR aceptado, ausencia de cambios funcionales y resultados remotos de CI/SCA
antes del retest.

READY_FOR_HANDOFF
