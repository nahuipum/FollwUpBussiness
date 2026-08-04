# Handoff Ciberseguridad — BE-007 — Revalidación final

## Estado

`PASS`

## Candidato verificado

- Base/HEAD: `f320938d55f8ca9bf58d0df0bab259749ca5974e`.
- Alcance: 3 rutas Backend modificadas y 10 nuevas bajo `backend/followupbussiness`; se excluyen gobernanza y handoffs.
- Fingerprint funcional: SHA-256 `261c12f5907fd534b6531095746d3108ec9c7f6caaefd688af9549d10b965c69`, recalculado con el algoritmo canónico del paquete v4 antes y después de pruebas.
- `git diff --check`: `PASS`.

## Superficie y escenarios de abuso revisados

| Superficie/abuso | Resultado y evidencia |
|---|---|
| Empresa suspendida o inexistente reutiliza token/sesión previa | `PASS`. El filtro autentica por request y la consulta durable exige sesión activa/no revocada, cuenta `ACTIVE`, coherencia sesión/cuenta y empresa `ACTIVE` para tenant no nulo. |
| Plataforma ligada a tenant o rol empresa sin tenant | `PASS`. Ambos casos fallan cerrado; plataforma válida conserva tenant nulo. |
| Token/entrada intenta derivar tenant | `PASS`. El actor usa estado durable; `tid` del token no otorga tenant. |
| Vendedor fuera de propietario o tenant | `PASS`. Exige tenant y propietario. |
| Supervisor fuera de equipo vigente o tenant | `PASS`. Exige membresía durable parametrizada por tenant. |
| Grant explícito amplía mínimos de vendedor/supervisor | `PASS`. No participa en esas rutas de autorización. |
| Auditoría y datos sensibles | `PASS`. `correlationId` no nulo se propaga; solo UUID técnicos, tipo de recurso y `ALLOWED`/`DENIED`; sin logger, cabeceras, payload, credenciales ni PII. |
| Inyección SQL por tipo/IDs de recurso | `PASS`. Consultas JDBC parametrizadas; V7 conserva FK compuestas. |

## Evidencia ejecutada

- `mvn "-Dmaven.repo.local=C:\tmp\followup-m2" "-Dtest=InboundJwtAuthenticatorTest,ResourceAccessAuthorizerTest" test`: `PASS`, 10/10, cero fallos/errores/skips.
- Evidencia QA reutilizada del mismo fingerprint: 14/14 dirigidas (`InboundJwtAuthenticatorTest`, `ResourceAccessAuthorizerTest`, arquitectura y módulos): `PASS`.
- Sin lecturas excepcionales de fuentes primarias; se usaron el paquete v4, handoff QA, candidato y dependencias directas de código necesarias para el riesgo.

## Hallazgos

Ninguno. `SEC-BE007-001` queda cerrado: cada solicitud company-scoped revalida empresa durable `ACTIVE`; suspendida/inexistente falla cerrada.

## Riesgos residuales

- V7 y las negativas de empresa suspendida/inexistente no se validaron con PostgreSQL/Flyway real porque Docker/Testcontainers no está disponible localmente.
- No existe CI asociado al diff no indexado; DoF debe bloquear cierre si falta commit revisable, PR y CI del mismo candidato.
- `ResourceAccessAuthorizer` no tiene aún consumidor productivo fuera de su bean; casos de uso futuros deben invocarlo y conservar tipos de recurso canónicos y sin PII.

## Controles no aplicables

WebSocket, Redis/cache, mensajería, archivos, ubicación, almacenamiento local, dependencias e infraestructura: sin cambios en el diff.
