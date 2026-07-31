# DoF Reassessment — EN-010

## Resultado

PASS

## Snapshot y hashes

- Candidato:
  `14b0565b8203a3f57618b1505665d4007816aaae`.
- Base:
  `4987f5eef7c9310b5a8ed4aa2c08f96d71b6de24`.
- Worktree DoF detached y limpio.
- Documentos posvalidación en
  `d1f015b8563b7b2ede344e1fbd1d0fd19586f9de`, fuera del candidato.
- ZIP:
  `3b879703d0894dfba4bcbab77c96e1a09fc4e1e90678455d7c6ff4d17c36ac77`.
- JAR:
  `afe3c1a60fc26cb488117e63a3cda3dfe1c7c50e6a29a8d295b2167e9e002e86`.
- SBOM:
  `35df2caf1177afd5c1d5c986e2162b906fe11dc140b9ef863ab986e06d4a905b`.
- Manifiesto de fuentes:
  `f59fb26ba8b7ef3a5b43b5ad763b05c1167f609542b2fd5a60048b787fa14e84`.
- Manifiesto de entregables:
  `7a39eb18e21b22fa2637eae93006d3639dd0b711c4e0ec70a0c7c70f90621fbb`.
- Trivy JSON:
  `17e8bd795b7472c531658f0960b30d4d73bddb55931b52024bee1b7efbcde913`.
- Trivy gate:
  `5fe0e09239310c9185ee916d65699b04a771dfc981d3a2b9fe4e00110abdf075`.

## Bloqueantes originales

| Bloqueante | Resultado |
|---|---|
| Sin evidencia CI | Resuelto: run real y verificable |
| Pipeline/SCA no ejecutados | Resuelto: Maven, ArchUnit y Trivy ejecutados |
| Snapshot contaminado por OR-Tools | Resuelto: candidato aislado sin EN-018/OR-Tools |
| ADR-010 sin aceptación trazable | Resuelto: aceptado por Luis Siancas — Owner |
| JAR/SBOM diferentes al snapshot revisado | Resuelto: artefactos nuevos ligados al candidato |
| Sin retest QA/Seguridad | Resuelto: ambos PASS sobre el mismo commit y hashes |
| Critical/High no confirmables | Resuelto: Trivy y Seguridad confirman 0 |

## Evidencia de subsanación

El diff del candidato contiene únicamente workflow CI, Maven Wrapper, POM,
pruebas de política, ADR-010 y política SCA. No contiene implementación,
configuración ni dependencias de EN-018, OR-Tools o EN-015; solo menciones
documentales que controlan su exclusión.

La configuración mantiene Spring Security explícito,
`anyRequest().authenticated()`, sin form login, HTTP Basic, logout ni usuario
por defecto. Las respuestas 401/403 permanecen sanitizadas y el secreto local
obligatorio falla de manera cerrada antes de servir tráfico.

## CI y SCA

La API privada fue consultada de forma independiente con credencial solo en
memoria:

- run `30590039853`, intento 1;
- SHA exacto del candidato;
- `completed/success`;
- job `91030097471` y sus pasos de build, arquitectura, inventario, Trivy,
  hashes y publicación en `success`;
- artifact `8778035114`, vigente y ligado al mismo SHA.

Surefire contiene 22 XML: 113 pruebas, 0 fallos, 0 errores y 1 spike live
opt-in omitido. El SBOM CycloneDX 1.6 contiene 58 componentes, sin
`serialNumber`; Tomcat core, EL y WebSocket están en 11.0.24. No aparece
OR-Tools en POM, SBOM o JAR.

Trivy informa 0 vulnerabilidades y el gate contiene 0 Critical/High.

## QA

QA emitió PASS sobre el candidato exacto, verificó API, artefacto, manifests,
build reproducible, regresión, dependencias, SBOM, deny-by-default, 401/403,
secreto ausente y exclusión de EN-018/EN-015.

## Seguridad

Seguridad emitió PASS sobre el mismo candidato y hashes. No existen hallazgos
Critical, High, Medium o Low nuevos. Los dos hallazgos históricos de EN-010
están cerrados.

## ADR-010

- Estado: `Aceptado`.
- Responsable: Luis Siancas — Owner.
- Fecha: 2026-07-30.
- La decisión documenta pipeline, SCA, evidencia, riesgos y reversión.

## Dependencias ajenas

EN-018 y `ortools-java` permanecieron fuera del candidato. El trabajo
concurrente del worktree original fue preservado. EN-015 continuó pausada.

## Hallazgos bloqueantes

No existen.

La frase histórica del README que indica ausencia de CI/SCA se clasifica como
deuda editorial no bloqueante: el workflow, ADR-010, política, run y artifact
constituyen evidencia primaria verificable y el texto no elimina ni degrada
los controles. Debe corregirse posteriormente antes de usar el README como
guía única.

## Riesgos residuales

- HTTPS productivo, sesiones, RBAC y aislamiento por recurso pertenecen a
  historias posteriores.
- La vigencia de la base Trivy debe mantenerse en cada run.
- El artefacto GitHub expira el 2026-08-29.
- CI Linux es el artefacto canónico; Windows fue reproducible dentro de su
  plataforma.

PASS
