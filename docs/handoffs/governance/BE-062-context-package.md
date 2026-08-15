# Paquete de contexto — BE-062 Gestionar zonas y territorios

- Estado actual: `PASS` final; Desarrollo `READY_FOR_HANDOFF`, QA `PASS`, Seguridad `PASS`, DoF `PASS`.
- Candidate-ID: `HEAD 14b5223b2280 + BE-062 workforce/audit/V26/pruebas de servicio+HTTP+proxy/handoffs` (árbol sin commit; reemplaza candidato previo tras corrección AOP).
- Alcance: crear, editar, listar, consultar e inactivar lógicamente territorios del tenant. Sin polígonos, balanceo u optimización.

## Gate de predecesoras

- `BE-051`: DoF `PASS` en `docs/handoffs/dof/BE-051-dof-handoff.md`; capacidad de auditoría disponible.
- `BE-058`: DoF `PASS` en `docs/handoffs/governance/BE-058-dof.md`; contrato estable de usuarios/roles disponible.

## Invariantes y controles

1. Código y nombre son únicos y validados dentro del tenant.
2. La inactivación es lógica y conserva historial; solo activos admiten nuevas asignaciones.
3. Listados/selectores tienen orden estable y estado explícito.
4. Crear, editar e inactivar dejan auditoría; rechazo, no-op, conflicto o fallo no dejan escrituras ni auditoría indebida.
5. `COMPANY_ADMIN` administra solo su tenant. `SUPERVISOR` solo lista/consulta; `SELLER` y anónimo, sin acceso. No filtro por equipo salvo contrato expreso.
6. Aislamiento total entre tenants, sin revelar existencia; respetar 403/404 contractual. Actor/recurso, éxito, denegación, conflicto/concurrencia y rollback deben quedar cubiertos.

## Fuentes autorizadas durante Desarrollo

- Historia: `docs/stories/backend/BE-062-gestionar-zonas-y-territorios.md`.
- Contrato: solo fragmento `docs/api/openapi.yaml` de `/territories` y `/territories/{territoryId}`.
- Diff, código y pruebas afectados. No alterar OpenAPI sin contradicción real autorizada.

## Artefactos del candidato

- Dev: `docs/handoffs/backend/BE-062-development-handoff.md`.
- QA: `docs/handoffs/qa/BE-062-qa-handoff.md`.
- Seguridad: `docs/handoffs/security/BE-062-security-review.md`.
- DoF: `docs/handoffs/dof/BE-062-dof.md`.

## Delta de QA

La revalidación anterior confirmó no-op sin escritura/auditoría y unicidad case-insensitive concurrente, pero faltaba evidencia HTTP. La remediación `TerritoryControllerTest` cubrió roles, aislamiento cross-tenant, conflicto y ausencia de escrituras/auditoría en rechazos. Un fallo real de arranque reveló que `TerritoryService final` impedía el proxy transaccional; se corrigió y `TerritoryServiceTransactionalProxyTest` valida el contexto AOP. QA, Seguridad y DoF aprobaron este candidato.
