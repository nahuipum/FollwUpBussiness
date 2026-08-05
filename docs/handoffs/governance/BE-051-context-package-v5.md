# Paquete de Contexto de Historia — BE-051 — v5

**Sustituye v4:** candidato corregido tras SEC-BE051-004. Criterios, ADR y
límites de v4 siguen vigentes.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Candidato | Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` + manifest v5 `20ac06dc9e5b27c5401e375893d5013f9248a95b2d2a871f972b51a44af3cc53`, reconstruible por `BE-051-candidate-v4-manifest.sha256` y el delta v5. Sin commit, PR o CI solicitados. |
| Desarrollo | `BE-051-development-handoff-v2.md` — `READY_FOR_HANDOFF`, 7 pruebas audit y 4 arquitectura PASS. |
| QA anterior | `BE-051-qa-handoff-v2.md` — `CHANGES_REQUIRED` por SEC-BE051-004. |
| Fuentes | HU `19566ed6…bdd8c6`; ADR-020 `68db79d4…299be`; ADR-016 `2d281cf…5815d`; contrato/API/AGENT permanecen como v4. |

## Criterios de regresión

| ID | Control obligatorio | Evidencia requerida |
|---|---|---|
| AC-01/OBS-01 | Contexto autenticado confiable y `Clock`; actor/acción/resultado/recurso/correlación. | 7 tests y pruebas negativas. |
| AC-02 | Allowlist saneada sin secretos/PII/payload. | Dominio/V8/tests. |
| AC-03/SEC-001 | Append-only e IP restringida por privilegios efectivos. | Roles, trigger, funciones y denegaciones. |
| AC-04/CON-01 | 365/90, lote 500, concurrencia/corte y purga limitada. | V8/V9/tests. |
| SEC-003 | tenant/actor/correlación/scope no entran libres. | comando/provider/enums. |
| SEC-004 | Writer y purger usan credenciales/URLs obligatoriamente distintas de Flyway y del datasource general, sin fallback; `JdbcTemplate` separado por operación. | `AuditDatabaseProperties`, configuración, store y pruebas de configuración/identidad. |

## Alcance y gates

- Módulo `audit`, V8/V9, configuración de credenciales segregadas y pruebas;
  sin endpoint BE-052, sin secretos en propiedades/hand-offs.
- La política de 365 días sigue siendo MVP, no asesoramiento legal; orden legal y
  backup/restore operativo siguen fuera del candidato de código.

| Fase | Entrada | Salida |
|---|---|---|
| QA final | Este paquete + Dev + QA v2 + Security previa + manifest v5 | `PASS`/otro estado en `docs/handoffs/qa/BE-051-qa-handoff-v3.md`. |
| Seguridad final | Paquete v5 + Dev + QA v3 + Security previa | `PASS`/otro estado en `docs/handoffs/security/BE-051-security-handoff-v2.md`; obligatoria. |
| DoF | Paquete v5 + todos los handoffs + PR/CI | `PASS`/`BLOCKED`, mismo manifest y ausencia de PR/CI declarada. |

## Regla de excepción

No releer fuentes primarias listadas sin registrar motivo, ruta, sección, hash y
resultado en el handoff. Cambio de fuente/candidato exige nuevo paquete.
