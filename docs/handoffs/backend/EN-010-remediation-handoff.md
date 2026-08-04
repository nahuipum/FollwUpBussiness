# Remediation Handoff — EN-010

## Bloqueantes atendidos

| Bloqueante DoF | Evidencia de subsanación |
|---|---|
| No existía evidencia de CI exitosa | GitHub Actions run `30590039853`, intento 1, concluyó `success` sobre el commit candidato |
| Pipeline/SCA no ejecutados | Workflow dedicado ejecutó Maven, ArchUnit, Trivy SCA, gate y publicación de evidencia |
| Snapshot distinto al validado | Candidato aislado e inmutable `14b0565b8203a3f57618b1505665d4007816aaae` |
| `ortools-java` contaminaba el snapshot | El candidato parte de `4987f5e` y excluye EN-018, OR-Tools y sus pruebas |
| ADR-010 sin aprobación trazable | ADR `Aceptado` por Luis Siancas — Owner el 2026-07-30 |
| JAR/SBOM no coincidían con evidencia previa | Se generaron artefactos nuevos y manifiestos SHA-256 desde el mismo run |
| QA y Seguridad no habían revisado el snapshot actual | Este handoff transfiere el candidato exacto para retest independiente |

Los runs fallidos `30589541808` y `30589806038` quedan superseded. El primero
detectó que `mvnw` no tenía modo ejecutable en Git; el segundo detectó que una
variable sintética global interfería con la prueba de secreto ausente. Ambos
defectos fueron corregidos antes del run candidato exitoso.

## Decisiones del usuario

- Estrategia: snapshot aislado desde `HEAD`, sin cambios locales de EN-018.
- ADR-010: `Aceptado`.
- Responsable: Luis Siancas — Owner.
- Fecha: 2026-07-30.
- Se autorizó una rama y commits exclusivos, push a `origin`, ejecución real
  de GitHub Actions y publicación durante un máximo de 30 días del JAR, SBOM,
  Surefire y manifiestos, sin secretos.
- El merge hacia `feature/first` se realizará únicamente después de las
  revisiones independientes y preservando el trabajo local existente.

## Snapshot candidato

- Rama: `remediation/EN-010-dof-blockers`.
- Base: `4987f5eef7c9310b5a8ed4aa2c08f96d71b6de24`.
- Commit candidato:
  `14b0565b8203a3f57618b1505665d4007816aaae`.
- Estado Git al entregar el candidato: limpio y alineado con
  `origin/remediation/EN-010-dof-blockers`.
- Este handoff es documentación posvalidación y no pertenece al snapshot
  candidato ni a `source-files.sha256`.

El inventario canónico contiene todos los archivos rastreados, ordenados, con
SHA-256 y tiene hash:
`f59fb26ba8b7ef3a5b43b5ad763b05c1167f609542b2fd5a60048b787fa14e84`.

## Cambios de alcance EN-010

- Pipeline GitHub Actions fijado por SHA para JDK 21, Maven Wrapper,
  `clean verify`, ArchUnit, SCA, hashes y artefactos.
- Maven Wrapper 3.9.16 con checksum SHA-256 fijado y bit ejecutable en Git.
- Timestamp común y fijo para reproducibilidad del JAR y SBOM.
- Pruebas de política para Wrapper, artefactos y pipeline.
- Compatibilidad de pruebas documentales con `.git` como archivo de worktree.
- Política SCA explícita.
- ADR-010 aceptado con aprobación trazable.

No se modificaron contratos API, modelos de datos, migraciones ni reglas de
negocio.

## Cambios ajenos preservados

EN-018, `ortools-java`, routing y los cambios locales del worktree original
quedaron fuera del candidato. EN-015 permaneció pausada y no se modificaron su
ADR ni su contrato de sincronización.

## CI

- Sistema: GitHub Actions.
- Run: `30590039853`, intento 1.
- URL:
  <https://github.com/nahuipum/FollwUpBussiness/actions/runs/30590039853>.
- Inicio: `2026-07-30T23:17:29Z`.
- Fin: `2026-07-30T23:20:27Z`.
- Conclusión: `success`.
- Runner: Ubuntu 24.04, Linux x64, kernel `6.17.0-1020-azure`.
- JDK: Eclipse Temurin `21.0.11+10`.
- Maven Wrapper: Apache Maven `3.9.16`.
- Comando principal:
  `./mvnw --batch-mode --no-transfer-progress clean verify`.
- Arquitectura:
  `-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test`.
- Resultado: 113 pruebas, 0 fallos, 0 errores y 1 omitida.
- La omisión corresponde al spike live opt-in de Geoapify sin credencial.
- Código de salida final del job: 0.

Todos los pasos del run candidato concluyeron correctamente: toolchain,
`clean verify`, ArchUnit explícito, inventario, Trivy JSON, gate
High/Critical, hashes, upload y resumen.

## SCA

- Herramienta: Trivy `0.70.0`.
- Acción: `aquasecurity/trivy-action` v0.36.0 fijada a
  `ed142fd0673e97e23eac54620cfb913e5ce36c25`.
- Entrada: SBOM CycloneDX generado por el mismo `clean verify`.
- Resultado informativo: 0 vulnerabilidades.
- Gate: 0 High y 0 Critical; `success`.
- Política: incluye hallazgos con y sin corrección; no existe `.trivyignore`.
- Un error de base de vulnerabilidades invalida el escaneo y hace fallar el
  workflow.

## SBOM y artefactos

- Artefacto GitHub: `8778035114`.
- Nombre:
  `backend-en010-14b0565b8203a3f57618b1505665d4007816aaae`.
- Tamaño: 24,676,838 bytes.
- Digest ZIP:
  `sha256:3b879703d0894dfba4bcbab77c96e1a09fc4e1e90678455d7c6ff4d17c36ac77`.
- Expiración: `2026-08-29T23:20:12Z`.
- Descarga verificada contra el digest publicado.
- SBOM: CycloneDX 1.6, 58 componentes, sin `serialNumber`.
- Escaneo de contenido sensible: 50 archivos de texto, 0 coincidencias.

## Tabla de hashes SHA-256

| Archivo o evidencia | SHA-256 canónico |
|---|---|
| Workflow CI | `23494f4dd02a3452b4d7260260a68ca102d2e42592fa62d5aa27cc7b4faa7bb0` |
| Maven Wrapper properties | `9e702bcd7e68ba1cace0a3382a7082e6e1e1b321688a7a3fbf4d5ae7eb0af533` |
| `pom.xml` | `3aeb61a36a6c6a6e54d8a41d7a80af347a1936a200b8c2e735db6f62d52f1406` |
| ADR-010 | `f280dc5bc5cd16d2cbc4ba45b25e77bee5d8532845e587d008c1e02ceffe08ba` |
| Política SCA | `fdb03bcb25721c974b7726ba53eea09e0413e2ba212a02db10e842817b72247f` |
| JAR CI | `afe3c1a60fc26cb488117e63a3cda3dfe1c7c50e6a29a8d295b2167e9e002e86` |
| SBOM CI | `35df2caf1177afd5c1d5c986e2162b906fe11dc140b9ef863ab986e06d4a905b` |
| Ambiente CI | `665aa985f1939e81147f2b55a6b8359fa6aa9ad39bc60e38a3a327d4819baa63` |
| Inventario de fuentes | `f59fb26ba8b7ef3a5b43b5ad763b05c1167f609542b2fd5a60048b787fa14e84` |
| Manifiesto de entregables | `7a39eb18e21b22fa2637eae93006d3639dd0b711c4e0ec70a0c7c70f90621fbb` |
| Trivy JSON | `17e8bd795b7472c531658f0960b30d4d73bddb55931b52024bee1b7efbcde913` |
| Trivy gate | `5fe0e09239310c9185ee916d65699b04a771dfc981d3a2b9fe4e00110abdf075` |
| 22 XML Surefire agregados | `795af648f8530513bc5c3704095c86ccfb882eec4377da0cacd40ca920851167` |

Las seis entradas de `deliverables.sha256` coinciden con los archivos
descargados. Los hashes CI Linux son canónicos. Dos builds locales consecutivos
en Windows también fueron internamente reproducibles —JAR
`1e36097364cf2eb5e8a086c1afe16c4e63287e0638a35c92475f87b8224c5b08`
y SBOM
`60c44eff3afbb6000c5bc9a225e31a991c3bcd20b91cf2043e2c047ca1374895`—,
pero no sustituyen los hashes canónicos del runner Linux.

## Pruebas y comandos

```bash
cd backend/followupbussiness
./mvnw --batch-mode --no-transfer-progress clean verify
./mvnw --batch-mode --no-transfer-progress \
  -Dtest=HexagonalArchitectureTest,ModuleBoundaryTest test
```

La suite cubre Spring Security activo, deny-by-default, rutas protegidas,
respuestas 401/403 sanitizadas, secreto externo obligatorio, fallo seguro sin
secreto, exclusiones Git, ausencia de secretos reales, arquitectura y
coherencia de dependencias/SBOM.

## Riesgos residuales

- La disponibilidad y actualidad de la base Trivy es dependencia del gate;
  una indisponibilidad debe producir fallo, nunca aprobación.
- HTTPS productivo, autenticación real, RBAC y aislamiento por recurso
  permanecen en sus historias posteriores.
- Los artefactos GitHub expiran a los 30 días; los hashes y referencias deben
  conservarse en los handoffs.
- La diferencia cross-OS de hashes no afecta el candidato: CI Linux es la
  fuente canónica y los dos builds Windows fueron reproducibles entre sí.

## Instrucciones exactas para QA

1. Verificar este handoff y después validar en modo solo lectura el commit
   separado `14b0565b8203a3f57618b1505665d4007816aaae`.
2. Confirmar que `git diff 4987f5e..14b0565` no contiene implementación,
   dependencias ni configuración de EN-018, OR-Tools o EN-015; las únicas
   menciones admitidas son controles documentales de exclusión de alcance.
3. Comparar workflow, Wrapper, POM, ADR y política con
   `source-files.sha256`.
4. Revisar el run `30590039853`, su conclusión, pasos y artefacto
   `8778035114`.
5. Verificar digest ZIP, JAR, SBOM, Trivy, Surefire y manifiestos.
6. Ejecutar nuevamente `clean verify` sin definir
   `FOLLOW_UP_BUSSINESS_SECURITY_LOCAL_SECRET`.
7. Repetir pruebas de arquitectura, deny-by-default, 401/403, secreto ausente,
   archivos ignorados y búsqueda de secretos.
8. Rechazar el snapshot si cambia cualquier archivo o hash durante el retest.

## Estado

READY_FOR_HANDOFF
