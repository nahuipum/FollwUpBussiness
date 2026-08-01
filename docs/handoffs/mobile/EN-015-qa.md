# Handoff QA Mobile — EN-015

## Estado

`PASS`

Revisión independiente del handoff de Desarrollo `READY_FOR_HANDOFF`.
QA no modificó ADR ni contrato y no ejecutó código productivo porque el diff de
EN-015 es exclusivamente documental.

## Evidencia por criterio

| Criterio | Evidencia revisada | Resultado |
|---|---|---|
| 1 | ADR-015: Drift/SQLite, SQLCipher, Keychain/Keystore y migraciones forward-only | PASS documental |
| 2 | Contrato v1: `pending → syncing → synced/error/conflict`, recuperación de `syncing` | PASS |
| 3 | Envelope con UUID, idempotencyKey, correlación, dependencia, secuencia, fecha/hora y ubicación original; orden por agregado | PASS |
| 4 | ADR/contrato: cierre forzoso, logout, cambio de tenant/usuario, token vencido/revocado, reinstalación y almacenamiento lleno | PASS |
| 5 | `docs/sync/mobile-sync-contract.md` declara `mobile-sync/v1`, envelope, respuesta, estados, errores y compatibilidad | PASS |
| 6 | Handoff deja explícitas las aprobaciones posteriores; no se confunde con aprobación | PASS |

## Escenarios revisados

- Reinicio/cierre forzoso: `syncing` sin acuse vuelve a `pending` con la misma
  idempotencia.
- Red intermitente: solo errores transitorios usan backoff, jitter y máximo de
  8 intentos; el agotamiento conserva el comando.
- Duplicado/replay: UUID e idempotencyKey estables y respuesta con referencia
  existente.
- Orden/concurrencia: dependencias confirmadas; serialización por agregado y
  concurrencia limitada entre agregados.
- Aislamiento: `tenantId` + `ownerUserId` obligatorios en base, cache y cola.
- Conflicto/token/espacio: bloqueo explícito, pausa de cola o acción manual; no
  hay borrado silencioso.

## Consumibilidad

El contrato es suficientemente claro para diseñar INT-015, INT-018, INT-024,
MOB-004, MOB-009, MOB-014, MOB-019, MOB-022, MOB-027, MOB-028 y MOB-032.
Las rutas backend y payloads de negocio siguen pendientes de sus historias; el
contrato no las inventa.

## Validación reproducible

- `git diff --check`: PASS.
- Inspección de diff: solo ADR-015, contrato v1 y handoffs EN-015; sin código
  Flutter, migraciones ni dependencias.
- `flutter analyze` y pruebas dirigidas: no aplican a este diff documental;
  deberán ejecutarse cuando se implemente la persistencia/cola.

## Riesgos residuales

La integración real SQLCipher/Drift, las rutas INT-015/INT-018 y la UX de
resolución de conflictos requieren pruebas de implementación. No bloquean la
definición documental de EN-015, pero Seguridad debe revisarlas antes de DoF.

`PASS`
