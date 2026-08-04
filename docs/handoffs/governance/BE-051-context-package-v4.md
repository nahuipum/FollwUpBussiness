# Paquete de Contexto de Historia — BE-051 — v4

**Sustituye v3:** candidato corregido tras `SEC-BE051-001..003`. Los criterios
y fuentes de v3 permanecen vigentes; este paquete incorpora el inventario
recalculable solicitado por Seguridad.

## Inmutabilidad

| Campo | Valor |
|---|---|
| Historia | `docs/stories/backend/BE-051-registrar-acciones-criticas.md` — `19566ed6…bdd8c6` |
| Candidato | Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` + 27 archivos enumerados en `BE-051-candidate-v4-manifest.sha256`; SHA-256 de líneas `path<TAB>hash` UTF-8/LF: `d4c5e5938b18c8f0630c6a8fa980599252b1a1bd64c1d2daedacbbbb2bb08bf8`. Sin commit, PR ni CI solicitados. |
| Dev de entrada | `docs/handoffs/backend/BE-051-development-handoff-v2.md` — `READY_FOR_HANDOFF` |
| Seguridad previa | `docs/handoffs/security/BE-051-security-handoff.md` — `CHANGES_REQUIRED`; sus tres hallazgos son la regresión obligatoria. |
| Creado por | Agente Orquestador |
| Vigente hasta | Cambio de fuente o candidato |

## Criterios y controles requeridos

| ID | Verificación | Fuente/regla | Evidencia esperada |
|---|---|---|---|
| BE051-AC-01/OBS-01 | Actor técnico, acción, recurso, resultado, scope mínimo, correlación y hora de servidor. | HU; RF-AUD-002; ADR-020 D1/D2 | Comando y contexto confiable, `Clock`, persistencia y prueba. |
| BE051-AC-02 | `before`/`after` allowlist saneada, sin secretos/PII/payload. | HU; ADR-020 D1 | Dominio + V8 + pruebas negativas. |
| BE051-AC-03 | Append-only realmente efectivo; IP separada/restringida; purge sin `DELETE` directo runtime. | ADR-020 D2; SEC-001 | V9 roles/grants/triggers/funciones y pruebas negativas. |
| BE051-AC-04/CON-01 | 365/90, purga ≤500, fecha servidor, idempotencia/concurrencia, vencidos excluidos. | ADR-020 D3–D5; SEC-002 | `Clock`, funciones V9, tests de corte/fecha/concurrencia. |
| BE051-SEC-01 | Tenant/actor/correlación/scope derivan de contexto confiable; recursos/scopes son vocabularios cerrados. | HU; API 1–3; SEC-003 | `RecordAuditEntryCommand`, provider SecurityContext y tests negativos. |

## Reglas y artefactos

- `00_CONTRATO_FUNCIONAL.md` RF-AUD-001/002 y RNF-006..008 (`62974da2…9db6b2`), API traceability 1–6 (`dadd7643…07a67`) y `backend/.../AGENTS.MD` (`4bea3fd0…3a4c1`) siguen aplicando.
- ADR-020 D1–D5 (`68db79d4…299be`) fija minimización, append-only, retención y pruebas; ADR-016 delega auditoría a ADR-020 (`2d281cf…5815d`).
- El alcance es módulo `audit`, V8/V9 y pruebas audit; no se añadió REST/OpenAPI ni se debe anticipar BE-052.
- Fuera de alcance: orden de conservación legal, endpoint de lectura, secretos/tokens/payloads y exposición pública de IP.

## Riesgos y gates

- El plazo MVP de 365 días no es asesoramiento legal; cambios requieren ADR y revisión Seguridad/Legal.
- Las categorías/campos permitidos se amplían solo por cambio trazado.
- QA debe revalidar todo el candidato corregido, incluida la regresión de seguridad; después Seguridad reevalúa los mismos tres hallazgos y backup/restore sigue como riesgo si no hay evidencia de infraestructura.

| Fase | Entrada | Salida/gate |
|---|---|---|
| QA regresión | Paquete v4 + Dev v2 + QA previa + candidato/manifest | `PASS`/otro estado en `docs/handoffs/qa/BE-051-qa-handoff-v2.md`; verificar manifest, 7 pruebas, arquitectura y SEC-001..003. |
| Seguridad regresión | Paquete v4 + Dev + QA v2 + Security previa | `PASS`/otro estado en `docs/handoffs/security/BE-051-security-handoff-v2.md`; obligatoria. |
| DoF | Paquete v4 + todos los handoffs + PR/CI + candidato | `PASS`/`BLOCKED`, mismo manifest y declarar ausencia de PR/CI. |

## Regla de excepción

No releer fuentes primarias listadas. Toda excepción registra motivo, ruta,
sección, hash y resultado; cambio de fuente/candidato exige paquete nuevo.
