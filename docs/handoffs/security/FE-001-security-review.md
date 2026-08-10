# FE-001 — Seguridad

**Estado:** PASS
**Candidate-ID:** `HEAD 4c30919ff7f676292df295229a6aeb0d8769cd69 + diff 12456f0f`

## Superficie revisada

Revalidación limitada a `SEC-FE001-01`: política TLS del proxy Vite y sus pruebas. Activos: credenciales y cookies de sesión en tránsito. Actor de abuso: atacante de red/DNS capaz de suplantar una API remota. Límite de confianza: Vite local → API.

## Resultado

- **PASS:** HTTPS remoto configura `secure: true`; Vite valida el certificado del destino.
- **PASS:** HTTP y HTTPS loopback configuran `secure: false`, limitado a la excepción local prevista.
- **PASS:** HTTP remoto continúa rechazado por `resolveDevApiProxyTarget`.
- **PASS:** QA independiente del mismo candidato: prueba dirigida 5/5, suite completa 24/24 y `git diff --check`.
- **NOT_EXECUTED:** no se repitió el abuso; el diff observable y la evidencia QA afectada bastan para el dictamen.

## Hallazgos y riesgo residual

`SEC-FE001-01` queda cerrado. No se identifican hallazgos nuevos ni ampliación de superficie. Permanece el riesgo residual aceptado de desactivar validación TLS para HTTPS loopback, restringido al entorno local.

No aplican a este delta autenticación/autorización, tenant, persistencia de tokens, secretos, datos personales/ubicación, WebSocket, cache/Redis, mensajería, archivos, dependencias ni infraestructura.
