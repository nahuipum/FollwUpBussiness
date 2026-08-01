# EN-010 — Política SCA

## Alcance

El análisis cubre el SBOM CycloneDX generado por el mismo
`./mvnw clean verify` que produce el JAR candidato de EN-010. El snapshot
aislado excluye expresamente EN-018, OR-Tools y EN-015.

## Herramienta y fuente

- Trivy 0.70.0.
- `aquasecurity/trivy-action` v0.36.0 fijada al SHA inmutable
  `ed142fd0673e97e23eac54620cfb913e5ce36c25`.
- Base de vulnerabilidades de Trivy actualizada durante la ejecución.

Si la base no puede descargarse, actualizarse o consultarse, el job falla y el
resultado no se considera un escaneo aprobado.

## Gate

- Cualquier vulnerabilidad `HIGH` o `CRITICAL`, tenga o no corrección
  disponible, hace fallar el pipeline.
- Los hallazgos `MEDIUM`, `LOW` y `UNKNOWN` se conservan como información para
  revisión.
- No se admite `.trivyignore` ni otra supresión silenciosa.

Una excepción requiere decisión formal que identifique ID/CVE, justificación,
responsable, fecha de expiración, control compensatorio y nueva revisión
independiente de Seguridad.

## Evidencia y protección

El workflow conserva por un máximo de 30 días:

- reporte JSON completo;
- tabla del gate `HIGH`/`CRITICAL`;
- JAR y SBOM del candidato;
- reportes Surefire;
- manifiestos SHA-256 del código y entregables.

Los artefactos no incluyen secretos, variables de entorno, dumps, payloads,
tokens ni cabeceras sensibles.

## Reproducción

```bash
cd backend/followupbussiness
./mvnw --batch-mode --no-transfer-progress clean verify
trivy sbom --scanners vuln --format json \
  --output target/ci-evidence/trivy-sca.json \
  target/sbom/application.cdx.json
trivy sbom --scanners vuln --severity HIGH,CRITICAL \
  --ignore-unfixed=false --exit-code 1 \
  --output target/ci-evidence/trivy-policy.txt \
  target/sbom/application.cdx.json
```

## Reversión

Retirar esta política y el workflow elimina el gate SCA y la evidencia
reproducible. Esa reversión exige una decisión arquitectónica explícita y no
puede presentarse como una entrega validada de EN-010.
