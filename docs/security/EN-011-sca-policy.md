# EN-011 — Política CI y SCA de cierre

## Alcance del candidato

El workflow `.github/workflows/backend-en011-closure-ci.yml` valida el
snapshot EN-011 que acepta ADR-011 y aplica la remediación de cierre. Usa
Ubuntu 24.04, Temurin JDK 21 y Maven Wrapper 3.9.16.

La compilación autoritativa es:

```bash
cd backend/followupbussiness
./mvnw --batch-mode --no-transfer-progress clean verify
```

`clean verify` ejecuta la suite JUnit completa, las reglas ArchUnit y las
integraciones Testcontainers aplicables, y genera el JAR y el SBOM CycloneDX.
El workflow vuelve a ejecutar de forma explícita la suite focalizada de
EN-011 y las reglas de arquitectura para que su evidencia sea identificable.

## Herramienta, versión y base

- Herramienta SCA: Trivy 0.70.0.
- Acción: `aquasecurity/trivy-action` 0.36.0, fijada al SHA inmutable
  `ed142fd0673e97e23eac54620cfb913e5ce36c25`.
- Entrada: SBOM CycloneDX agregado producido por Maven sobre el árbol completo
  de dependencias resueltas, incluidas transitivas.
- Base: Trivy Vulnerability Database descargada durante la ejecución. El
  reporte integral, el gate y la consulta de metadatos reutilizan
  explícitamente el mismo cache `$GITHUB_WORKSPACE/.cache/trivy`.
- Identidad material de la base: SHA-256 y tamaño en bytes de los archivos
  efectivamente usados `db/trivy.db` y `db/metadata.json`.
- Fecha de adquisición/observación: `observedAt` es obligatorio y registra el
  instante UTC posterior a la descarga y primera consulta. Se conserva tanto
  en `trivy-db-evidence.json` como en `sca-observed-at.txt`.
- Fecha propia de la base: `updatedAt` se conserva en
  `trivy-db-evidence.json` únicamente cuando Trivy expone
  `VulnerabilityDB.UpdatedAt` como texto no vacío. Si está presente, no puede
  ser posterior a `observedAt`.

El workflow no interpreta `UpdatedAt` como fecha de descarga ni exige un campo
`DownloadedAt` que Trivy 0.70.0 no incluye en este JSON. Si la base o sus
metadatos no se pueden descargar, consultar, identificar, hashear o medir, el
job falla y no existe resultado SCA válido.

El SBOM es inventario y no se declara como resultado SCA. Los resultados SCA
son exclusivamente `trivy-sca-full.json` y `trivy-policy-high-critical.txt`,
producidos por Trivy a partir de ese inventario resuelto.

## Gate

- Cualquier vulnerabilidad `HIGH` o `CRITICAL`, tenga o no corrección
  disponible, falla el pipeline.
- `UNKNOWN`, `LOW` y `MEDIUM` se conservan en el reporte integral para revisión.
- No se admite `.trivyignore` ni supresión silenciosa.
- Una excepción requiere una decisión formal con CVE/ID, justificación,
  responsable, expiración, control compensatorio y nueva revisión
  independiente.

## SAST

No existe configuración SAST en el snapshot. El workflow registra literalmente
`SAST_CONFIG_MISSING` en `target/ci-evidence/sast-status.txt`. Esta entrega no
declara ejecución ni cobertura SAST y no inventa una herramienta fuera del
alcance autorizado.

## Retención de artefactos

La autorización de cierre permite publicar mediante
`actions/upload-artifact`, fijada al SHA inmutable
`ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2), una única colección con
retención de 30 días. El upload apunta exclusivamente a
`target/en011-artifact`, un staging creado desde una allowlist cerrada. No se
publica el árbol general `target/`, el workspace ni rutas dinámicas.

El staging y el upload no leen GitHub Secrets. Antes de hashear y subir, el
workflow rechaza symlinks, rutas o nombres fuera de la allowlist y firmas de
credenciales, tokens, claves privadas o secretos tanto en archivos de texto
como dentro del JAR.

## Evidencia

El workflow genera, valida y hashea en el workspace efímero del runner:

- JAR y SBOM del candidato;
- POM efectivo y árbol completo de dependencias Maven;
- reportes Surefire y Failsafe, cuando estos últimos existan;
- reporte SCA integral, tabla y estado del gate High/Critical;
- versión de Trivy, metadatos de la base, `observedAt` obligatorio,
  `updatedAt` opcional, SHA-256 y tamaño en bytes de `trivy.db` y
  `metadata.json`;
- estado SAST explícito;
- hashes SHA-256 de los entregables publicados;
- manifiesto del commit, run y comandos reproducibles.

La evidencia no incluye secretos, archivos `.env`, variables de entorno,
dumps, tokens, credenciales, cabeceras, logs no revisados ni payloads de
negocio. Los reportes de pruebas son los emitidos por Surefire/Failsafe; el
workflow no añade volcados generales del runner.

El gate Trivy registra primero `PASS` o `FAIL`, conserva y sube la evidencia, y
después fuerza el resultado terminal del job. Así, un hallazgo High/Critical no
se pierde por el corte temprano del pipeline y sigue bloqueando el cierre.

## Interpretación

La existencia del workflow no equivale a una ejecución CI exitosa. Desarrollo
solo puede declarar CI/SCA ejecutados cuando exista un run real asociado al
commit candidato y sus artefactos. Los resultados locales de Maven y la
generación del SBOM tampoco sustituyen ese run ni el gate SCA.

## Reversión

Retirar el workflow o esta política elimina el gate y la trazabilidad de
cadena de suministro del cierre EN-011. Esa reversión requiere una decisión
formal y nueva revisión independiente; no puede presentarse como candidato
validado.
