# QA Backend — EN-011

## Estado

`PASS`

Retest independiente efectuado el 2026-07-30 (America/Lima) sobre el candidato exacto `7f8a2717a5aa70d101affec202bba0e767add057` de `feature/en-011-closure`. Este snapshot sustituye la conclusión QA histórica: la contradicción objetiva de la evidencia SCA anterior invalida aquel PASS. No se reutilizó como aprobación; solo se conserva como trazabilidad histórica.

## Alcance y fuentes revisadas

- Historia `docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md` y criterios 1–5; requisitos aplicables tipos de usuario 6.1–6.4, RF-AUT-003 y RNF-006 de `00_CONTRATO_FUNCIONAL.md`.
- Handoff de Desarrollo vigente `docs/handoffs/backend/EN-011-closure-remediation-handoff.md` (`READY_FOR_HANDOFF`), manifiesto reproducible y `ADR-011` aceptado.
- Diff desde la base declarada `df18774c1b15fb0fed3a421258ba9032ae81ffc3` hasta el candidato. La corrección final cambia workflow CI/SCA, prueba de política, política SCA y manifiesto; no añade endpoint, usuario, sesión, asignación, migración ni código funcional del catálogo.
- Prueba revisada antes de la implementación: `En011ClosurePipelinePolicyTest`; workflow `.github/workflows/backend-en011-closure-ci.yml`; contrato afectado: ninguno REST/evento/WebSocket/sync.

El worktree tenía modificaciones ajenas concurrentes; se preservaron y no se atribuyen a EN-011.

## Matriz criterio → implementación → prueba → evidencia

| Criterio | Implementación revisada | Prueba/evidencia independiente | Resultado |
|---|---|---|---|
| 1–2. Cuatro roles exactos, estables, únicos y documentados | `BaseRole`, `RoleScope`, V1/R y ADR-011; catálogo global, cerrado, con ámbitos PLATFORM/COMPANY | El snapshot lógico incluye las clases, migraciones y `BaseRoleTest`; CI ejecutó sus reportes sin fallo. ADR enumera literalmente los cuatro códigos y sus ámbitos. | PASS |
| 3. Base limpia y seed repetibles | Flyway V1 y seed R con convergencia; sin cambio de migración en este candidato | `BaseRoleCatalogMigrationTest` está en el manifiesto y en CI; reporte Surefire sin fallo. Hashes de V1/R conservados por el manifiesto/handoff de Desarrollo. | PASS |
| 4. Sin creación/elevación pública de roles | No hay controlador ni contrato nuevo; Security mantiene deny-by-default | Diff candidato no introduce superficie REST, comandos, eventos, usuarios ni sesión; CI ejecutó `SecurityConfigurationTest`. | PASS |
| 5. Pruebas y evidencia reproducible | Workflow con Wrapper/JDK 21, `clean verify`, suite EN-011 y arquitectura; artefacto cerrado | Run `30601633807`, attempt 2, job `91072356994`: `completed/success` sobre el SHA candidato. XML Surefire: 26 reportes, 129 pruebas, 0 fallos, 0 errores, 5 opt-in omitidas. | PASS |
| Cierre SCA exigido por el snapshot | Trivy 0.70.0 usa un único cache explícito para reporte, metadatos y gate; evidencia material SHA-256/tamaño de `trivy.db` y `metadata.json` | Artefacto: Trivy 0.70.0, `updatedAt` 2026-07-31T01:16:01.565726584Z, `observedAt` 2026-07-31T04:23:59Z, 0 vulnerabilidades; gate High/Critical `PASS`. | PASS |
| Integridad y retención de evidencia | Allowlist, secret scan, hashes y `upload-artifact` fijado por SHA; 30 días | ZIP SHA-256 `C2D06BCC...58D892C` coincide; `deliverables.sha256` 64/64; 65 rutas permitidas, incluido el propio manifiesto de hashes; SBOM CycloneDX 1.6 con 58 componentes. | PASS |
| Límites hexagonales/multiempresa | No se altera `identityaccess` funcional; catálogo global no es asignación tenant | CI ejecutó `HexagonalArchitectureTest` y `ModuleBoundaryTest`; no se modifica persistencia tenant, cache, eventos ni WebSocket. `tenantId`, idempotencia de comandos y migraciones nuevas: NOT_APPLICABLE al diff de cierre. | PASS |

## Comandos y evidencia

| Acción | Resultado |
|---|---|
| `git rev-parse HEAD`, `git show` y diff base→candidato | HEAD y candidato coinciden en `7f8a271...add057`; alcance final limitado a CI/SCA, política, prueba y manifiesto. |
| Consulta pública GitHub Actions del run y jobs del attempt 2 | Run `30601633807` y job `91072356994` existen, están `completed/success` y el SHA remoto coincide. |
| `Get-FileHash` del ZIP descargado | SHA-256 coincide con el manifiesto: `C2D06BCC78982EF409453587405582B86CBBA8DFF56891061C65DB77358D892C`. |
| Verificación independiente de `deliverables.sha256`, recuento y allowlist | 64/64 hashes correctos; 65 archivos del artefacto, sin ruta fuera de la allowlist. |
| Recalcular algoritmo del manifiesto sobre las 16 fuentes materiales | Digest `8062754176a5fbc837ddeea1f36636cd4814e1b85a837bd896066d2217f28db6`, coincidente. |
| Parseo local de Surefire, SBOM y JSON Trivy extraídos | 129/0/0/5; SBOM 58 componentes; 0 vulnerabilidades; gate `TRIVY_GATE_HIGH_CRITICAL=PASS`. |

No se repitieron suites Maven: el run remoto verificable es del mismo SHA y el artefacto con integridad verificada por hashes no mostró inconsistencia objetiva que aportase evidencia nueva con una repetición local.

## Hallazgos

No hay hallazgos abiertos reproducibles.

## Regresión relevante y riesgos residuales

- Regresión relevante: `clean verify`, pruebas focalizadas EN-011 y ArchUnit constan en el job remoto exitoso; sus reportes extraídos son íntegros.
- SAST permanece explícitamente `SAST_CONFIG_MISSING`; no se interpreta como SAST aprobado ni como resultado SCA.
- La evidencia descargable vence conforme a la retención de 30 días. Conservar SHA, digest, run/attempt/job y ZIP verificado para trazabilidad.
- El catálogo es global por diseño; aislamiento `tenantId`, autorización por objeto, sesiones e idempotencia de asignaciones deberán probarse en las historias que los introduzcan. No aplican al cambio de cierre revisado.
- Ciberseguridad debe emitir su retest independiente del mismo snapshot antes de DoF; este PASS no lo sustituye.

PASS