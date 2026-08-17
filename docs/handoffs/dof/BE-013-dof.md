# BE-013 — Definition of Finished

**Estado:** `BLOCKED`  
**Candidate-ID:** `HEAD 5702c0a + BE-013 customers/V28/PostGIS/REST/auditoría-atómica`.

## Evidencia de compuerta

- QA `PASS` y Seguridad `PASS` declaran el Candidate-ID indicado; no hay hallazgos abiertos.
- `HEAD` es `5702c0a`; el árbol contiene los cambios BE-013 declarados y `git diff --check` no reporta errores.

## Compuertas faltantes

- El handoff de Desarrollo está `READY_FOR_HANDOFF`, pero su Candidate-ID figura como «Pendiente de cálculo por Orquestación»; falta evidencia Dev trazable al candidato actual.
- Para este cambio de composición compartida, falta evidencia CI-equivalente local `clean verify` aprobada para el candidato actual: la ejecución declarada terminó por timeout y el PASS reutilizado no está ligado al Candidate-ID.
