# EN-011 — Manifiesto reproducible de remediación de cierre

## Identidad

- Historia: `EN-011`.
- Autorización: opción A de ADR-011, 2026-07-30.
- Commit base previo: `df18774c1b15fb0fed3a421258ba9032ae81ffc3`.
- Candidato autorizado y ejecutado: rama `feature/en-011-closure`; commit
  definitivo `7f8a2717a5aa70d101affec202bba0e767add057`.
- Ejecución remota: GitHub Actions run
  [30601633807](https://github.com/nahuipum/FollwUpBussiness/actions/runs/30601633807),
  attempt `2`, job `91072356994`, resultado `success`.
- Artefacto:
  `backend-en011-closure-7f8a2717a5aa70d101affec202bba0e767add057-2.zip`;
  SHA-256
  `C2D06BCC78982EF409453587405582B86CBBA8DFF56891061C65DB77358D892C`.
- Digest lógico SHA-256:
  `8062754176a5fbc837ddeea1f36636cd4814e1b85a837bd896066d2217f28db6`.

## Fuentes materiales

```text
.github/workflows/backend-en011-closure-ci.yml
backend/followupbussiness/.mvn/wrapper/maven-wrapper.properties
backend/followupbussiness/pom.xml
backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/BaseRole.java
backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/domain/model/RoleScope.java
backend/followupbussiness/src/main/resources/db/migration/R__seed_identity_access_base_roles.sql
backend/followupbussiness/src/main/resources/db/migration/V1__create_identity_access_role_catalog.sql
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/architecture/HexagonalArchitectureTest.java
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/architecture/ModuleBoundaryTest.java
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/domain/model/BaseRoleTest.java
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/BaseRoleCatalogMigrationTest.java
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/DependencySecurityPolicyTest.java
backend/followupbussiness/src/test/java/com/nahui/followupbussiness/security/En011ClosurePipelinePolicyTest.java
docs/architecture/adr/ADR-011-catalogo-roles-base.md
docs/security/EN-011-sca-policy.md
docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md
```

Los handoffs y este manifiesto se excluyen para evitar autorreferencia. EN-012,
EN-013, roles, migraciones y código funcional ajenos al listado no forman parte
de la remediación.

## Algoritmo

Desde la raíz Git, definir `$paths` con las rutas anteriores y ejecutar:

```powershell
$lines = foreach ($path in ($paths | Sort-Object)) {
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  "$path`t$hash"
}
$utf8 = [Text.UTF8Encoding]::new($false)
$bytes = $utf8.GetBytes(($lines -join "`n") + "`n")
$sha = [Security.Cryptography.SHA256]::Create()
$digest = ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
$lines
"snapshot_sha256=$digest"
```

Cualquier diferencia invalida las revisiones previas y exige repetir QA y
Ciberseguridad sobre el nuevo digest.

## Evidencia que genera CI

```text
target/en011-artifact/build/followupbussiness-0.0.1-SNAPSHOT.jar
target/en011-artifact/dependencies/application.cdx.json
target/en011-artifact/dependencies/effective-pom-en011.xml
target/en011-artifact/dependencies/dependency-tree-en011.txt
target/en011-artifact/tests/surefire-reports/**
target/en011-artifact/tests/failsafe-reports/** (si Maven los genera)
target/en011-artifact/sca/trivy-sca-full.json
target/en011-artifact/sca/trivy-policy-high-critical.txt
target/en011-artifact/sca/trivy-gate-status.txt
target/en011-artifact/sca/trivy-version-db.json
target/en011-artifact/sca/trivy-db-evidence.json
target/en011-artifact/sca/sca-observed-at.txt
target/en011-artifact/sca/sast-status.txt
target/en011-artifact/manifests/candidate-manifest.txt
target/en011-artifact/manifests/deliverables.sha256
```

El workflow copia exclusivamente estas rutas al staging, valida una allowlist
cerrada, rechaza symlinks, nombres sensibles y firmas de secretos, verifica los
hashes y publica el staging con `actions/upload-artifact` fijada por SHA y
retención de 30 días. No publica `.env`, secretos, variables de entorno, logs
no revisados ni payloads de negocio.

El reporte integral, el gate y la consulta de metadatos reutilizan el cache
`$GITHUB_WORKSPACE/.cache/trivy`. `trivy-db-evidence.json` registra
`observedAt` obligatorio, SHA-256 y tamaño en bytes de `db/trivy.db` y
`db/metadata.json`; solo incluye `updatedAt` cuando Trivy lo expone. El SHA
candidato, URL/ID del run y resultado del gate se registran desde Git/GitHub
Actions sin modificar el commit después de su creación.
