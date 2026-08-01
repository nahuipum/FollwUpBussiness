# EN-017 — Manifiesto de candidato documental

**Estado:** `BLOCKED`
**Motivo de bloqueo:** falta evidencia CI de un commit/referencia candidata; no
hay workflow EN-017 que incluya estos artefactos y no se autorizan commits.

## Snapshot exacto

- HEAD: `d928f7f8905d85e3d76e017c2ed943290e62e2ff`.
- El candidato es un worktree sin commit. Al capturar esta evidencia contiene
  modificaciones en `docs/api/openapi.yaml`, `ADR-008` y
  `event-catalog.yaml`, y artefactos EN-017 no rastreados listados abajo; este
  manifiesto también es un artefacto nuevo no rastreado del candidato.
- Se preservan los cambios ajenos bajo `docs/handoffs/frontend/`; no se
  modificaron código, proveedores, SDK, migraciones ni commits.

## Inventario SHA-256

| SHA-256 | Ruta |
|---|---|
| `9F4604B5178F70631CD6CFC8288CEAAB9A043D9222F7F972A7BB6A24BEFC13CF` | `docs/architecture/adr/ADR-008-autenticacion-sesiones.md` |
| `FDD78D7DB69B51B3DBAD430578D1772C854DC8687EC68E7E3F8BF4279073E318` | `docs/architecture/adr/ADR-017-canales-notificacion.md` |
| `2C07295D6CCA242A2BCE08E5F6505EE046765F37318D2833C7A0BDCEAFFA4A65` | `docs/events/notification-contract.md` |
| `5B943958E7AEB45B569F5BF2438EA814F9F95DF8DA2C240B655194CCA61231F3` | `docs/events/event-catalog.yaml` |
| `273DB7B1C26EEADEACF0F701CA216AA3F313294161BFED9CDA246C79FC501F8D` | `docs/api/openapi.yaml` |
| `0E3605F65C599A45715047ABB136AE88074BB466E5B2B9B4F1BF89C6FF984288` | `docs/handoffs/backend/EN-017-development-handoff.md` |
| `C118A17BFB55277F6396DA1F1CC5FCEEB4072F5BD79709B273A137EA956CE530` | `docs/handoffs/backend/EN-017-consumability-review.md` |
| `39E597E67375F6FA6ECBF16E0A22519A20392AEA9449C7D252793E3DF3A85241` | `docs/handoffs/backend/EN-017-qa.md` |
| `94CE2079A941D4017FA9C21C3E2FAF8D7850E5EA6C23350F515CDBDFF80742D6` | `docs/handoffs/frontend/EN-017-consumability-review.md` |
| `ABAAEFBB53DF24C4AE474F71346B5BF3833D4FC8365A0B924E7BD219F78289C6` | `docs/handoffs/mobile/EN-017-consumability-review.md` |
| `73DB3002A63E76F39FF10DDD43CFB9D13B580F1F239C955FB7577373EFCCE721` | `docs/handoffs/security/EN-017-security-review.md` |
| `EF839C91DA55BE59A96A07F9DB427B452D7DB4D737114F27283BE12F51090025` | `docs/handoffs/governance/EN-017-decisions.md` |
| `3B767754B878B2C148FAC80E00FB65230E65969401FF2DB962869BB1DE2A4679` | `docs/handoffs/governance/EN-017-dof.md` |
| `35213E9029F2EE094873DE5D566EB619BADE83FDF69AAFE0051BE31BFD1794BA` | `docs/handoffs/governance/EN-017-phase0-dependency-validation.md` |

## Validaciones ejecutadas

| Comando | Resultado |
|---|---|
| `npx --yes @redocly/cli lint docs/api/openapi.yaml` | PASS; OpenAPI válido con configuración recomendada. |
| `npx --yes prettier --check docs/events/event-catalog.yaml` | PASS; YAML con formato válido. |
| `git diff --check` | PASS; sin errores de whitespace en el diff rastreado. |
| `Get-FileHash -Algorithm SHA256 <inventario>` | PASS; huellas registradas arriba. |

## Trazabilidad CI

No existe un workflow EN-017 ni uno que incluya las rutas ADR-017,
`notification-contract.md`, catálogo, OpenAPI y handoffs EN-017. Los únicos
workflows locales revisados, `backend-en010-remediation-ci.yml` y
`backend-en011-closure-ci.yml`, están limitados por `paths` a EN-010/EN-011 y
no validan este candidato. GitHub Actions requiere una referencia remota
inmutable (commit/PR/push); el candidato actual es un worktree sin commit y la
restricción vigente prohíbe crear uno.

**Brecha exacta:** commit/PR que contenga el inventario y workflow CI que se
dispare para EN-017, con URL/ID/resultado retenido como evidencia.
**Owner requerido:** responsable de integración CI/DevOps; no se identifica una
persona responsable de CI en decisiones EN-017, por lo que no se asigna una
identidad inventada. El Owner Luis Siancas aprobó D1--D8, no una ejecución CI.

## Próximo paso autorizado

El responsable de integración debe crear/revisar el workflow o asociar estos
paths a uno existente y ejecutar CI sobre un commit/PR autorizado. Tras ello,
actualizar hashes si cambia cualquier artefacto y entregar URL/ID/resultado a
DoF. Este manifiesto no sustituye QA, Seguridad ni DoF.
