# Backend Handoff — EN-011 Closure Remediation

## Estado

`BLOCKED`

La implementación y las validaciones locales están completas. El cierre no
puede quedar `READY_FOR_HANDOFF` porque no existe ejecución GitHub Actions del
candidato ni SCA integral con Trivy y base fechada. Trivy no está instalado
localmente. El SBOM generado no se presenta como SCA.

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
  UTC, reporte integral y gate High/Critical.
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
- Comando: `trivy --version` / SCA integral.
  Resultado: `NOT_EXECUTED`; Trivy no está instalado localmente.

## Criterios de aceptación

| Criterio | Implementación | Evidencia | Estado |
|---|---|---|---|
| ADR-011 aceptado según opción A | Metadatos, decisión y límites explícitos | ADR-011 | Implementado |
| Snapshot anterior sustituido | Historia, handoff histórico y manifiesto nuevo | Digest `e1ddcfc0...c8e0a86` | Implementado |
| CI usa JDK 21, Wrapper y `clean verify` | Workflow dedicado | Prueba de política; Maven local | Implementado |
| ArchUnit/Testcontainers ejecutables | Suites explícitas | 47/47 focalizadas | Implementado |
| SBOM CycloneDX reproducible | Fase Maven verify | 58 componentes | Implementado |
| SCA integral con herramienta/base/fecha/gate | Trivy 0.70.0 configurado | Sin run real | Bloqueado |
| SAST no inventado | `SAST_CONFIG_MISSING` | Política y workflow | Implementado |
| Evidencia persistente descargable | Upload allowlisted fijado por SHA, 30 días | Prueba de política; pendiente run real | Implementado |
| Sin cambios funcionales EN-012/013 | Diff limitado a cierre EN-011 | `git status`/diff | Implementado |

## Riesgos residuales

- El workflow no ha sido ejecutado y podría revelar un defecto de sintaxis o
  comportamiento solo observable en GitHub Actions.
- No hay conclusión SCA del árbol completo ni gate High/Critical ejecutado.
- La sintaxis y comportamiento del upload/secret scan deben confirmarse en el
  run real; la evidencia autorizada quedará retenida 30 días.
- Los PASS históricos de QA/Seguridad no aplican al digest nuevo.

## Pendientes conocidos

1. Crear commit/PR por el flujo autorizado del repositorio.
2. Ejecutar `.github/workflows/backend-en011-closure-ci.yml` sobre ese SHA.
3. Registrar URL/ID del run, versión/base/fecha Trivy y resultado del gate.
4. Descargar el artefacto del run y verificar `deliverables.sha256`, allowlist y
   retención de 30 días.
5. Repetir QA y Ciberseguridad; luego solicitar DoF.

## Instrucciones de reproducción

1. Configurar JDK 21 y Docker.
2. Desde `backend/followupbussiness`, ejecutar
   `.\mvnw.cmd --batch-mode --no-transfer-progress clean verify`.
3. Ejecutar la suite focalizada declarada en el workflow.
4. Recalcular el digest con el algoritmo del manifiesto.
5. Ejecutar el workflow en el commit candidato y comprobar que Trivy identifica
   su base, que el gate High/Critical finaliza sin hallazgos y que el artefacto
   conserva únicamente el payload autorizado durante 30 días.

## Recomendación para QA

No reutilizar el handoff QA anterior. Esperar el run CI/SCA del commit
candidato y validar su SHA/digest, ADR aceptado, ausencia de cambios funcionales
y resultados del gate antes del retest independiente.

BLOCKED
