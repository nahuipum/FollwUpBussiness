# Paquete de Contexto de Historia — BE-051 — v6

**Sustituye v5:** candidato corregido tras la segunda regresión de
SEC-BE051-004. Los criterios, ADR y límites de v5 permanecen vigentes.

## Inmutabilidad

- Base: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`.
- Candidato: SHA-256 `4d23aad32d2cb2855a6060e20c83b5fc206cbd8e400d6c7b3b9f715441d416e5`
  de 28 líneas `path<TAB>sha256`, UTF-8/LF sin final. El inventario se
  reconstruye como: ADR-016, ADR-020, V8, V9 y todos los archivos bajo
  `backend/followupbussiness/src/{main,test}/java/com/nahui/followupbussiness/audit/`,
  ordenados por ruta. Sin commit, PR ni CI.
- Entrada: Dev v2 `READY_FOR_HANDOFF`; QA v3 `CHANGES_REQUIRED`; Security
  previa `CHANGES_REQUIRED`.

## Regresión obligatoria

1. Matriz BE-051 completa: datos mínimos/allowlist, append-only, 365/90,
   correlación, tenant/recurso, idempotencia, concurrencia y arquitectura.
2. SEC-001..003: roles/triggers/functions, `Clock`, contexto confiable/enums.
3. SEC-004 final: no constructor/fallback de datasource único; writer y purger
   con URL y usuario obligatoriamente distintos de sí y del general/Flyway;
   integración con logins PostgreSQL reales que compruebe `current_user`,
   append/purge por datasource dedicado y denegación de leer IP/alterar/borrar.

## Reglas vigentes

HU `19566ed6…bdd8c6`; contrato RF-AUD/RNF `62974da2…9db6b2`; API tenancy
`dadd7643…07a67`; ADR-020 D1–D5 `68db79d4…299be`; ADR-016 referencia
`2d281cf…5815d`; invariantes Backend `4bea3fd0…3a4c1`. Sin REST BE-052,
orden legal ni backup/restore operativo en alcance. No secretos/tokens/payloads
ni IP pública. No releer fuentes primarias sin excepción documentada.

| Gate | Entrada | Salida |
|---|---|---|
| QA final | Este paquete + Dev/QA/Security previos | `PASS`/otro estado en `docs/handoffs/qa/BE-051-qa-handoff-v4.md` |
| Seguridad final | Paquete + Dev + QA v4 + Security previa | `PASS`/otro estado en `docs/handoffs/security/BE-051-security-handoff-v2.md` |
| DoF | Paquete + todos los handoffs + PR/CI | `PASS`/`BLOCKED`; mismo candidato y ausencia de PR/CI declarada. |
