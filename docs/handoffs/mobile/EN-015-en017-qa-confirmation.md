# Confirmación QA Mobile independiente — EN-015 para Fase 0 de EN-017

## Estado

`PASS` — confirmación QA Mobile del snapshot técnico de EN-015.

Esta confirmación no aprueba ADR-015, `mobile-sync/v1`, ADR-016 ni la
gobernanza de EN-015; tampoco inicia EN-017. El bloqueo de Fase 0 se mantiene:
ADR-015 y el contrato siguen en estado `Propuesto` y requieren aceptación
humana trazable o mock estable.

## Ambiente y alcance

- Worktree compartido, PowerShell/Windows; `HEAD` revisado: `57eace3`.
- Delta rastreado: solo
  `docs/architecture/adr/ADR-016-privacidad-retencion-y-rastreo.md`.
- Sin cambios en ADR-015, `docs/sync/mobile-sync-contract.md`, Flutter,
  dependencias, migraciones, cola, secure storage ni pruebas móviles.
- `mobile/followupbussiness/` continúa como scaffold: `pubspec.yaml` no declara
  Drift, SQLCipher ni secure storage; `lib/` y `test/` no aportan una
  implementación EN-015 que ejecutar.

## Matriz de aceptación y riesgo

| Criterio / riesgo | Implementación o decisión revisada | Prueba / escenario | Evidencia y resultado |
|---|---|---|---|
| 1. Persistencia, cifrado y migración; secure storage | ADR-015 selecciona Drift/SQLite + SQLCipher, clave aleatoria por instalación/ámbito en Keychain/Keystore y migraciones forward-only | Base cifrada; clave ausente; migración fallida conserva base y modo seguro (prueba futura de implementación) | `docs/handoffs/mobile/EN-015-qa.md` y revisión de ADR-015: PASS documental; no hay delta ejecutable |
| 2. Offline, cola durable y reinicio | Estados `pending -> syncing -> synced/error/conflict`; `syncing` sin acuse vuelve a `pending` | Cierre forzoso/reinicio sin respuesta; nunca marcar `synced` sin acuse | QA EN-015 cubre recuperación; ADR-015 y contrato sin cambios: PASS reutilizado |
| 3. Reintentos, idempotencia y orden | UUID/idempotencyKey estables; FIFO por tenant/propietario/agregado; 8 intentos, backoff+jitter; conflicto/4xx definitivos bloquean automático | Red/timeout/5xx/rate limit; replay; dependencia y concurrencia por agregados | QA EN-015 cubre red, duplicado y orden: PASS reutilizado |
| 4. Segregación local y ciclo de sesión | `tenantId + ownerUserId` obligatorios en base/cache/cola; logout o cambio invalida contexto | Cambio de usuario/tenant y token revocado: sin lectura/captura cruzada ni descarte silencioso | ADR-015/contrato sin delta y QA EN-015: PASS reutilizado |
| 5. GPS, permisos, jornada y rastreo; alineación ADR-016 | ADR-016 conserva autoridad de validez/retención; tracking solo durante jornada, se detiene al logout; pendiente queda cifrado y bloqueado hasta disposición autorizada y trazable | Offline + logout/cambio de ámbito: detener tracking, bloquear ámbito, conservar pendiente hasta acuse/exportación/resolución autorizada | Diff ADR-016 y confirmación técnica Mobile: no hay contradicción con ADR-015 ni `mobile-sync/v1`: PASS |
| 6. Limpieza local, almacenamiento y privacidad | Sin espacio se detiene captura sensible sin borrar; limpieza tras disposición autorizada; logs sin tokens, documentos, payload ni coordenadas completas | Disco lleno, reinstalación y limpieza de clave/datos tras disposición; inspección de logs (futuro dispositivo) | ADR-015, ADR-016 D4/D12 y Security EN-015: PASS documental; pruebas físicas pendientes de historias implementadoras |

## Verificación reproducible y regresión

- `python -m graphify query "How are mobile local persistence and synchronization implemented?" --budget 800`: ejecutado; el grafo no expone símbolos de implementación móvil y confirma el contexto local. `python -m graphify explain "Mobile"` solo resuelve una referencia documental de seguridad.
- `git diff --name-only HEAD`: únicamente ADR-016.
- `git diff --check`: PASS (advertencia no bloqueante de normalización LF/CRLF en ADR-016).
- Inspección dirigida de `pubspec.yaml`, `lib/` y `test/`: sin superficie Flutter de EN-015 modificada.
- No se ejecutaron `flutter analyze` ni pruebas: sería repetición costosa/no pertinente al no existir cambio de código ni nueva evidencia técnica. Se reutiliza el `PASS` de `docs/handoffs/mobile/EN-015-qa.md` y la confirmación técnica Mobile del mismo snapshot.

## Hallazgos y riesgos residuales

No se encontraron hallazgos reproducibles que requieran cambios. La nueva
alineación de ADR-016 elimina la ambigüedad de limpieza: conserva pendientes,
exige disposición autorizada y trazable y deja el ámbito bloqueado y seguro si
no concluye. No autoriza borrar cola, visitas o ventas silenciosamente.

Siguen pendientes para INT-015/INT-018 y las historias Mobile implementadoras:
validación en dispositivo de SQLCipher/Drift y Keychain/Keystore, recuperación
real tras crash, borrado/rotación de claves, capacidad llena, permisos/GPS,
inicio/parada de tracking por jornada y logout, y contratos backend. Son riesgos
de implementación, no un cambio del snapshot técnico EN-015.

`PASS` para QA Mobile de consumibilidad y cobertura documental; la Fase 0 de
EN-017 continúa `BLOCKED` por el gate de gobernanza indicado.
