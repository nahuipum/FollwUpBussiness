# DoF Reassessment — EN-011

## Resultado

PASS

## Evidencia revisada

- Historia `docs/stories/enablers/EN-011-definir-catalogo-de-roles-base.md` y ADR-011 aceptado el 2026-07-30.
- Candidato `feature/en-011-closure@7f8a2717a5aa70d101affec202bba0e767add057`, con delta desde `df18774c1b15fb0fed3a421258ba9032ae81ffc3` limitado al cierre CI/SCA, política, trazabilidad y su prueba de política.
- Handoff de Desarrollo `READY_FOR_HANDOFF`, QA `PASS` y Seguridad `PASS`, todos identificados con el SHA y digest del candidato.
- Run GitHub Actions `30601633807`, intento `2`, job `91072356994`, y artefacto `backend-en011-closure-7f8a2717a5aa70d101affec202bba0e767add057-2.zip`.
- ZIP local y extracción `target/en011-run-30601633807`; política SCA, manifiesto reproducible, reportes Surefire, SBOM y evidencia Trivy.

## Snapshot e integridad

- SHA candidato: `7f8a2717a5aa70d101affec202bba0e767add057`.
- Digest de las 16 fuentes materiales, recalculado independientemente: `8062754176a5fbc837ddeea1f36636cd4814e1b85a837bd896066d2217f28db6`.
- ZIP SHA-256, recalculado: `C2D06BCC78982EF409453587405582B86CBBA8DFF56891061C65DB77358D892C`.
- `deliverables.sha256`: 64/64 hashes válidos. El ZIP contiene 65 entradas, sin rutas absolutas ni traversal; la extracción contiene 65 archivos y no nombres sensibles.
- El `candidate-manifest.txt` del artefacto liga el mismo SHA al run, intento, URL y comando Maven Wrapper en Temurin JDK 21.

## Trazabilidad de criterios

| Criterio | Evidencia trazable del candidato | Estado |
|---|---|---|
| Catálogo exacto | `BaseRole`, V1 y seed R enumeran los cuatro códigos y ámbitos; `BaseRoleTest` pasó 3/3. | PASS |
| Códigos estables, únicos y documentados | Enum cerrado, PK/CHECK SQL y ADR-011; el reporte de migración pasó sin fallos. | PASS |
| Base limpia repetible | Flyway V1 y seed R son parte del digest; `BaseRoleCatalogMigrationTest` pasó 4/4. | PASS |
| Sin creación/elevación pública | El delta no introduce endpoint, usuario, sesión ni asignación; `SecurityConfigurationTest` pasó 29/29 y la configuración conserva deny-by-default. | PASS |
| Pruebas y evidencia reproducible | CI y artefacto del mismo SHA: 26 XML Surefire, 129 pruebas, 0 fallos, 0 errores y 5 opt-in omitidas. | PASS |

## Gates

| Gate | Estado | Evidencia |
|---|---|---|
| Desarrollo | PASS | Handoff vigente `READY_FOR_HANDOFF`; diff sin ampliación funcional EN-011 ni cambios de contratos de transporte. |
| QA independiente | PASS | Handoff QA sobre el SHA/digest exactos; criterios, regresión, artefacto, SBOM y SCA retesteados. |
| Seguridad independiente | PASS | Handoff de Seguridad sobre el mismo candidato; `SEC-EN011-001` y `SEC-EN011-002` cerrados y sin Critical/High abiertos. |
| CI y pruebas | PASS | Run `30601633807` intento 2/job `91072356994` exitoso; reportes íntegros incluyen pruebas focalizadas de dominio, migración, seguridad, arquitectura y política CI. |
| SCA | PASS | Trivy 0.70.0 sobre el SBOM resuelto: resumen `Java/jar: 0`; gate `TRIVY_GATE_HIGH_CRITICAL=PASS`. Base con `UpdatedAt` 2026-07-31T01:16:01.565726584Z y observación 2026-07-31T04:23:59Z. |
| Contratos y documentación | PASS | No hubo cambio REST, eventos, WebSocket ni sync; ADR-011, política SCA, manifiesto, instrucciones de reproducción y rollback documentan el alcance aplicable. |
| Operabilidad y evidencia | PASS | Workflow con Wrapper/JDK 21, Testcontainers, SBOM, staging allowlisted, secret scan, hashes y artefacto con retención configurada de 30 días. |

## Hallazgos bloqueantes

No existen.

## Riesgos aceptados

- SAST sigue declarado explícitamente como `SAST_CONFIG_MISSING`; no se presenta como control ejecutado ni como sustituto de SCA.
- El conocimiento de vulnerabilidades corresponde a la base Trivy observada el 2026-07-31; nuevas ejecuciones deben actualizar la evidencia.
- El catálogo global no implementa sesiones, asignaciones tenant, permisos por objeto ni bootstrap: corresponden a EN-012, BE-057, BE-003 y BE-007.
- El artefacto remoto tiene retención de 30 días; conservar SHA, digest, run/attempt/job y ZIP verificado para trazabilidad.

## Condiciones posteriores

Cualquier cambio material de las 16 fuentes del manifiesto invalida este PASS y exige repetir QA, Seguridad y DoF sobre el nuevo SHA/digest.

PASS