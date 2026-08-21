# INT-003 — Paquete de contexto

## Estado

`BLOCKED` — validación de predecesoras, sin cambios de implementación.

## Alcance previsto

Validación E2E Flutter + API + secure storage: login `SELLER` activo por
cliente `MOBILE`, renovación, logout/revocación y segregación local por tenant.
No incluye alta de usuarios, roles, recuperación de contraseña ni autenticación
web.

## Gate de predecesoras

| Predecesora | Evidencia localizada | Estado |
| --- | --- | --- |
| BE-003 | DoF `PASS` | Cumple |
| BE-004 | DoF `PASS` | Cumple |
| BE-005 | DoF v20 `PASS` | Cumple |
| MOB-001 | DoF `PASS` | Cumple |
| MOB-002 | DoF `PASS` | Cumple |
| MOB-027 | DoF `PASS` | Cumple |
| INT-004 | Solo historia; no hay artefactos de Desarrollo, QA, Seguridad o DoF ni contrato estable verificable | **BLOCKED** |

## Hallazgo

`INT-004-DEP-01` (Alta, integración/contrato): falta evidencia canónica de que
INT-004 produce un vendedor activo disponible para login móvil, aislado por
tenant y auditado. Afecta la puerta de Ready de INT-003. Remediación mínima:
completar INT-004 o aportar sus artefactos canónicos y contrato estable.

## Decisión

No se ejecuta Mobile QA, Desarrollo, Seguridad ni DoF de INT-003. No se creó
Candidate-ID porque no hubo modificación de implementación.
