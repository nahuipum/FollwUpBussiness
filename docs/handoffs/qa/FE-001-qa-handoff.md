# FE-001 — QA Frontend

**Estado:** PASS
**Candidate-ID:** `HEAD 4c30919ff7f676292df295229a6aeb0d8769cd69 + diff 12456f0f`

## Revalidación afectada — SEC-FE001-01

| Criterio | Implementación | Prueba/evidencia |
|---|---|---|
| HTTPS remoto valida certificado | `developmentProxy`: hostname no loopback → `secure: true` | `vite.config.test.ts`: PASS |
| Loopback conserva excepción local | hostname loopback → `secure: false` | destino HTTPS `localhost` y proxy por defecto: PASS |
| HTTP remoto continúa denegado | `resolveDevApiProxyTarget` | caso `http://api.example.test`: PASS |

Comandos independientes: `npm test -- vite.config.test.ts` (5/5 PASS) y `npm test` (24/24 PASS), ejecutado completo por tratarse de suite compartida que cambió. `git diff --check` del delta: PASS.

No hay hallazgos reproducibles. La corrección no cambia contratos ni amplía la superficie HTTP; no se revalidaron criterios ajenos. Los cambios locales ajenos al candidato permanecen excluidos.
