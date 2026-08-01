# Aceptación de Arquitectura — EN-015

## Estado

`ACEPTADO`

## Decisión humana

- **Opción:** A — ADR-015 y `mobile-sync/v1` son el contrato estable de EN-015.
- **Responsable humano de Arquitectura:** Luis Siancas — Owner.
- **Fecha:** 2026-07-31 (America/Lima).

## Confirmaciones técnicas previas

| Disciplina | Estado | Evidencia |
|---|---|---|
| Mobile | `PASS` | `docs/handoffs/mobile/EN-015-en017-consumability-confirmation.md` |
| Backend | `PASS` | `docs/handoffs/backend/EN-015-en017-consumability-confirmation.md` |
| QA Mobile | `PASS` | `docs/handoffs/mobile/EN-015-en017-qa-confirmation.md` |

La alineación ADR-016/ADR-015 preserva pendientes cifrados, segregados y con
disposición autorizada y trazable antes de limpieza. QA, Seguridad y DoF
históricos de EN-015 permanecen como evidencia reutilizada porque el snapshot
técnico de ADR-015 y `mobile-sync/v1` no cambió.

## Alcance y límites

Esta aceptación desbloquea el uso documental del contrato por las historias
dependientes, incluida la Fase 0 de EN-017. No implementa Flutter, endpoints,
rutas ni payloads de INT-015/INT-018; tampoco selecciona proveedores o define
contratos de notificación.

## Riesgos residuales

- La implementación SQLCipher/Drift, los endpoints de sincronización y sus
  pruebas de dispositivo siguen pendientes de las historias implementadoras.
- La reconciliación explícita con OpenAPI futuro corresponde a INT-015/INT-018
  y no autoriza cambios silenciosos de `mobile-sync/v1`.
