# Validación de dependencias — EN-017 Fase 0

## Estado

`READY_FOR_HANDOFF`

EN-013 y EN-015 cuentan con ADR y contratos estables y aceptados. EN-017 puede
iniciar su Fase 1 de decisiones humanas; este handoff no autoriza todavía D1–D8
ni la definición de proveedores, contratos de notificación o código.

## Archivos y snapshot revisable

- `docs/stories/enablers/EN-017-definir-canales-de-notificacion.md`
- `docs/stories/enablers/EN-013-definir-autenticacion-sesiones-y-recuperacion.md`
- `docs/stories/enablers/EN-015-definir-persistencia-local-y-sincronizacion.md`
- `docs/architecture/adr/ADR-008-autenticacion-sesiones.md`
- `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md`
- `docs/api/openapi.yaml`
- `docs/sync/mobile-sync-contract.md`
- `docs/handoffs/governance/EN-013-dof.md`
- `docs/handoffs/governance/EN-015-dof.md`
- `docs/handoffs/governance/EN-015-acceptance.md`
- confirmaciones de Mobile, Backend y QA Mobile de EN-015 para EN-017.
- handoffs QA y Seguridad de EN-013 y EN-015 indicados por sus DoF.

La revalidación se realizó sobre el worktree actual. No se modificaron código,
OpenAPI, ni contratos de notificación; ADR-015 y `mobile-sync/v1` solo reciben
su estado y aceptación de gobernanza.

## Resultado de dependencias

| Dependencia | Evidencia | Resultado |
|---|---|---|
| EN-013 autenticación, sesión y recuperación | ADR-008 está `Aceptado` por Luis Siancas — Owner; DoF, QA y Seguridad EN-013 están `PASS`. Define recuperación neutral, tokens de un uso/expiración, revocación/logout, canal MOBILE y secure storage. | `ESTABLE` |
| EN-015 persistencia local y sincronización | ADR-015 y `mobile-sync/v1` están `Aceptado` por Luis Siancas — Owner, 2026-07-31. Mobile, Backend y QA Mobile confirmaron `PASS`; la alineación con ADR-016 conserva disposición autorizada y trazable antes de limpiar pendientes. | `ESTABLE` |

## Confirmaciones y decisión

- Mobile: `PASS` — `docs/handoffs/mobile/EN-015-en017-consumability-confirmation.md`.
- Backend: `PASS` — `docs/handoffs/backend/EN-015-en017-consumability-confirmation.md`.
- QA Mobile: `PASS` — `docs/handoffs/mobile/EN-015-en017-qa-confirmation.md`.
- Arquitectura: opción A aceptada por Luis Siancas — Owner, 2026-07-31
  (America/Lima), registrada en `docs/handoffs/governance/EN-015-acceptance.md`.

## Riesgos preservados

- SQLCipher/Drift y rutas/payloads de INT-015/INT-018 permanecen pendientes de
  implementación y validación; no deben inferirse ni cambiar el contrato sin
  revisión compatible.
- La siguiente fase debe obtener decisiones humanas D1–D8 antes de definir
  `notifications` o elegir cualquier proveedor.

## Siguiente agente autorizado

Coordinador/default para Fase 1 de EN-017: solicitar las decisiones humanas
D1–D8 y sus confirmaciones requeridas.

`READY_FOR_HANDOFF`
