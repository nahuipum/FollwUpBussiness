# INT-001 — Informe DoF

- **Estado:** `PASS`
- **Candidate-ID:** `e01c35c+0061cef1e255`

Las transiciones son válidas: Desarrollo `READY_FOR_HANDOFF`, QA `PASS` y Seguridad `PASS`. Los cuatro artefactos coinciden en el Candidate-ID; `INT001-QA-01` y `SEC-GATE-01` están cerrados, sin hallazgos abiertos.

La evidencia declarada para el mismo candidato incluye pruebas focalizadas de Desarrollo y QA, regresión de seguridad y `mvn -q clean verify` en PASS. La comprobación final `git diff --check` no informa errores. El estado de Git muestra únicamente el conjunto backend cubierto por el digest y los handoffs no rastreados.
