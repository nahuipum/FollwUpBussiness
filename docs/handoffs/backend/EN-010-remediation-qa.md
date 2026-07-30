# QA Retest — EN-010

Este informe supersede el `BLOCKED` provisional emitido antes de disponer de
acceso autenticado al run y al artefacto privado.

## Snapshot validado

- Worktree QA exclusivo y detached.
- HEAD:
  `14b0565b8203a3f57618b1505665d4007816aaae`.
- Estado inicial y final: limpio, sin cambios rastreados durante QA.
- Diff contra `4987f5e`: sin implementación, configuración ni dependencias de
  EN-018, OR-Tools o EN-015. Solo contiene controles y menciones documentales
  de exclusión.
- Este informe es posvalidación y no pertenece al snapshot candidato.

## Manifiesto y hashes

- ZIP calculado:
  `3b879703d0894dfba4bcbab77c96e1a09fc4e1e90678455d7c6ff4d17c36ac77`.
- El hash coincide con la API de GitHub y el handoff.
- `source-files.sha256`: 503 registros; SHA-256
  `f59fb26ba8b7ef3a5b43b5ad763b05c1167f609542b2fd5a60048b787fa14e84`.
- Los seis hashes de `deliverables.sha256` coinciden con JAR, SBOM, entorno,
  manifiesto de fuentes y ambos reportes Trivy extraídos.

La discrepancia provisional `c4ef…` quedó resuelta: correspondía a una
representación local reordenada. La comparación registro a registro produjo
502 blobs Git idénticos. `mvnw.cmd` usa el atributo `eol=crlf`; el hash CI y
worktree `46eedb…` y el blob LF `4a361e…` difieren únicamente por la
normalización declarada. No existe discrepancia de snapshot.

## CI revisado

QA consultó de forma independiente la API privada con la credencial mantenida
solo en memoria:

- run `30590039853`;
- intento `1`;
- SHA exacto del candidato;
- estado `completed`;
- conclusión `success`;
- job `JDK 21 / Maven verify / SCA`: `success`;
- `clean verify`, arquitectura, inventario, Trivy JSON, gate High/Critical,
  hashes y publicación: todos `success`;
- artifact `8778035114`, nombre ligado al SHA candidato, 24,676,838 bytes, no
  expirado y digest coincidente.

## Matriz criterio → prueba → evidencia

| Criterio | Prueba | Evidencia | Resultado |
|---|---|---|---|
| Evidencia reproducible | Dos `mvnw.cmd clean verify` locales; manifiestos CI | JAR/SBOM reproducibles; ZIP, entregables y fuentes trazados al candidato | PASS |
| Configuración documentada | ADR-010, política SCA, workflow y README | ADR aceptado; hashes canónicos coinciden | PASS |
| Validaciones aplicables | Suite, ArchUnit, seguridad y SCA | Local y CI: 113 pruebas, 0 fallos, 0 errores, 1 omitida opt-in | PASS |

## Regresión

- Local: Maven Wrapper 3.9.16, JDK 21.0.9 y dos `clean verify` exitosos.
- CI: Ubuntu 24.04, Temurin 21.0.11 y Wrapper 3.9.16.
- Surefire CI: 22 XML y 22 TXT; 113 pruebas, 0 fallos, 0 errores y 1 omitida.
- La omisión corresponde al spike live opt-in
  `GeoapifyLiveSpikeTest#validatesPeruGeocodingMapLibreStyleAndBurstBehavior`.
- Arquitectura explícita: 4 pruebas, sin fallos.
- Deny-by-default, 401/403 sanitizados, secreto ausente y Git ignores:
  cubiertos y ejecutados.

## Dependencias y SBOM

- CycloneDX 1.6, 58 componentes, sin `serialNumber`.
- Tomcat core, EL y WebSocket: 11.0.24.
- Sin OR-Tools/`ortools-java` en POM, árbol, JAR o SBOM.
- Trivy 0.70.0: 0 vulnerabilidades.
- Gate High/Critical: `success`.

## Defectos

No hay defectos abiertos dentro del alcance EN-010.

## Estado

PASS
