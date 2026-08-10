# FE-001 — Desarrollo Frontend

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD 4c30919ff7f676292df295229a6aeb0d8769cd69 + diff 12456f0f`

## Delta atribuido

- Login React, validación, carga, error genérico, sesión inválida, rutas por rol, logout y accesibilidad.
- Cliente API y proxy Vite: HTTP permitido únicamente en loopback durante desarrollo; HTTPS obligatorio fuera de local y opcional localmente con certificado y clave configurados juntos.
- Remediación `SEC-FE001-01`: el proxy usa `secure: false` solo para loopback y valida certificados de destinos HTTPS remotos; una prueba negativa cubre la política.
- Configuración y guía local alineadas; el artefacto Backend ya no contiene una contraseña PostgreSQL predeterminada.
- Pruebas de contexto Spring aisladas de credenciales e integraciones reales para mantener paridad con CI.

La referencia visual vigente es `FE-001.html` más `FE-001-login-states.html`. El error genérico se implementó mediante el modal accesible compartido; QA debe aceptar la desviación respecto de la alerta inline del mockup o devolverla a Desarrollo.

## Evidencia

- `npm test`: 24/24 PASS.
- `npm run build` (incluye typecheck): PASS.
- `npm run lint`: PASS antes del delta dirigido, que solo modifica configuración y prueba tipadas.
- `mvn --batch-mode --no-transfer-progress clean verify`: 344 pruebas, 0 fallos, 5 omitidas, PASS.
- GitHub Actions del commit base `4c30919…`, run `31409443631`, job `93523686904`: SUCCESS; el delta Frontend tiene equivalente local en PASS.
- `git diff --check`: PASS.

No se incluyen los cambios locales `CompanyUser*`, `.idea` ni el mockup no rastreado `FE-001-login-states-v2.html`.
