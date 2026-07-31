# Handoff Desarrollo Mobile — EN-015

## Estado

`READY_FOR_HANDOFF`

Este documento es una entrega de Desarrollo; no es aprobación de QA, Seguridad
ni DoF. No se realizaron commits.

## Archivos modificados

- `docs/architecture/adr/ADR-015-persistencia-local-sincronizacion-mobile.md`
- `docs/sync/mobile-sync-contract.md`
- `docs/handoffs/mobile/EN-015-development-handoff.md`

No se modificó código Flutter ni se añadieron dependencias productivas.

## Decisiones y alternativas

Se selecciona Drift sobre SQLite con SQLCipher y una clave por instalación/ámbito
protegida por Keychain/Keystore. La cola durable usa UUID e idempotencyKey
estables, segregación `tenantId` + `ownerUserId`, orden por agregado y estados
`pending -> syncing -> synced|error|conflict`. Se descartaron
SharedPreferences/JSON, un almacén no relacional sin migraciones acordadas y el
borrado silencioso de pendientes; el detalle está en ADR-015.

## Dependencias asumidas

- EN-010: seguridad HTTP deny-by-default y secretos locales; no hay endpoints de
  negocio implementados.
- EN-013: MOBILE usa refresh opaco en secure storage, con expiración/revocación;
  el token no forma parte del envelope ni de logs.
- INT-015/INT-018 deben publicar rutas, códigos y payloads backend antes de
  habilitar sincronización real. No se inventaron esos contratos.

## Matriz de aceptación

| Criterio | Decisión/evidencia | Prueba propuesta |
|---|---|---|
| 1. Persistencia, cifrado y migración | ADR-015, “Motor”, “Clave” y “Migraciones”; contrato v1 | Migración forward-only, base cifrada y clave ausente/inaccesible |
| 2. Estados de cola | ADR-015 y contrato v1, tabla de transiciones | Unit/integración de las cinco transiciones y recuperación de `syncing` |
| 3. Idempotencia, orden, fecha/coordenada | Envelope y secciones de orden/tiempo | Repetición, dependencia, concurrencia entre agregados y conservación byte-a-byte |
| 4. Ciclo de vida y almacenamiento | ADR-015 y contrato, “Sesión y ciclo de vida” | Reinicio, cierre forzoso, logout, cambio de tenant, token revocado, reinstalación y disco lleno |
| 5. Contrato versionado consumible | `docs/sync/mobile-sync-contract.md`, `mobile-sync/v1` | Validación de JSON/schema, compatibilidad 1.0.x y rechazo seguro de 2.x |
| 6. Aprobaciones independientes | Este handoff deja QA/Seguridad/DoF pendientes | QA de escenarios offline/aislamiento y revisión de seguridad antes de cierre |

## Validación de Desarrollo

Validación documental: completada contra EN-015, EN-010, EN-013, ADR-002,
ADR-007, ADR-009, `PROJECT_CONTEXT`, `ENGINEERING_RULES`, `TEAM_WORKFLOW` y las
reglas funcionales RN-008/RN-009/RN-011/RN-012/RF-UBI-007/RF-UBI-008/RF-VIS-002/
RF-VIS-003/RF-VIS-005/RF-VTA-012. `git diff --check` debe ejecutarse sobre el
diff final.

No aplica `flutter analyze` ni pruebas dirigidas: no hubo código Flutter,
dependencias ni migraciones modificadas. QA debe validar el contrato y los
escenarios propuestos independientemente.

## Riesgos y pendientes

- SQLCipher/Drift y la política exacta de retención requieren validación de
  implementación/producto antes de codificar.
- Rutas y respuestas backend de INT-015/INT-018 aún no existen.
- Conflictos requieren UX y endpoint de resolución posterior.

`READY_FOR_HANDOFF`
