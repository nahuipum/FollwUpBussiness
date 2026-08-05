# Handoff Seguridad — BE-007 Compose v5

**Estado:** PASS  
**Candidato revisado:** `f8cf15e6768d8d3facb0ecf7e4303e24f4ccde6a`  
**Paquete de contexto:** `docs/handoffs/governance/BE-007-context-package-v5.md`  
**Handoff previo:** `docs/handoffs/qa/BE-007-compose-qa-handoff.md`

## Alcance y evidencia

- El delta del candidato es exclusivamente `docker-compose.yml`.
- La clave canónica de Spring se encuentra en la línea 9 y toma el valor desde
  `${FOLLOW_UP_BUSSINESS_SECURITY_LOCAL_SECRET:?...}`; no contiene literal.
- `.env` está ignorado en `.gitignore:79`, no está rastreado y el árbol candidato
  solo contiene `.env.example`.
- Las credenciales requeridas conservan el marcador `:?`.
- Puertos de Postgres, Redis y RabbitMQ ligados a `127.0.0.1` (líneas 39, 62 y
  80–81); observabilidad `internal` (línea 113).
- QA PASS verificó configuración, binding en runtime y stack healthy; PR #8
  apunta al candidato con tres checks de CI SUCCESS.

## Hallazgos y riesgo residual

- Sin hallazgos de Seguridad.
- Riesgo residual operativo: quien posea acceso al host o daemon Docker puede
  inspeccionar variables de entorno. Se debe proteger `.env` y el acceso Docker.
- Autenticación/autorización funcional, tenant, PII, WebSocket, mensajería y
  dependencias no aplican al delta exclusivo de Compose; no se repitieron suites
  o scans generales.

## Decisión

PASS. El ajuste preserva la inyección local del secreto sin exponerlo ni ampliar
la superficie de red del stack.
