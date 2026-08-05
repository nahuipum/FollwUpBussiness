# Handoff — BE-004 — QA Backend afectado v5

## Estado

PASS

## Candidato verificado

| Elemento | Evidencia | Resultado |
|---|---|---|
| Paquete | `BE-004-context-package-v5.md` | Vigente; sin relectura de fuentes primarias. |
| Base | `a7e444a684d032be4da9ee4aac48528a33bd5fd7` | Candidato acotado a remediación SEC-02/09. |
| Manifiesto v5 | 22 hashes individuales | `PASS (22/22)`. |
| Huella del manifiesto | SHA-256 | `b13d15f571c94c9f7c7b8850e33979999b2d002f215dd57db7eb3e934f6fea13`, conforme a v5. |

## Matriz resumida

| Criterio/control | Implementación revisada | Prueba/evidencia QA | Estado |
|---|---|---|---|
| SEC-BE004-02; BE004-AC01 | `RefreshService` genera C1 antes del CAS; `JdbcRefreshSessionAdapter.rotate` persiste `refresh_token_digest` y `csrf_token_digest` en una misma actualización condicionada. | `RefreshSessionTransactionIntegrationTest.webRefreshRotatesCsrfAndRejectsThePreviousValue`: C0→C1→C2 y C0 contra R2 rechazado, sobre PostgreSQL/Flyway. | PASS |
| SEC-BE004-09; BE004-AC04 | `RefreshService` propaga el correlationId saneado del comando; el adaptador audit guarda únicamente `channel`, `result` y `reason` allowlisted. V10 permite solo dicha clave adicional. | Carrera integrada: registro `ALREADY_ROTATED` conserva correlationId, contiene `reason=REPLAY` y no contiene el refresh presentado. Inspección: `RefreshController` mantiene el mismo UUID saneado en respuesta y comando; su huella no cambió frente a QA v4. | PASS |
| SEC-BE004-10; no regresión transaccional | CAS/historial/audit permanecen en la transacción PostgreSQL. | Integración de rollback por fallo de audit y prueba de carrera; PASS. | PASS |
| BE004-AC02..03; SEC-BE004-01,03..08 | Sin superficie alterada por v5. | Evidencia QA v4 reutilizada: 19 pruebas dirigidas PASS; manifiesto v5 confirma las huellas no afectadas. | PASS |
| Migración/límites | V10 restringe `after_state` a claves técnicas; puerto de audit y adaptador siguen separados por módulos. | `AuditEntryMigrationTest`, `HexagonalArchitectureTest`, `ModuleBoundaryTest`. | PASS |

## Comandos y resultados

- Verificación PowerShell de las entradas de `BE-004-candidate-v5.sha256`: `PASS (22/22)`; SHA del archivo conforme a v5.
- `mvn -q "-Dtest=RefreshServiceTest,RefreshSessionTransactionIntegrationTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS (16 tests, 0 fallos/errores/omitidos). Incluyó PostgreSQL/Testcontainers y Flyway V10.
- `git diff --check a7e444a684d032be4da9ee4aac48528a33bd5fd7 -- backend/followupbussiness`: PASS.

## Hallazgos

Ninguno.

## Regresión relevante y riesgos residuales

- La evidencia nueva cubre exclusivamente SEC-02/09 y la no regresión de migración, concurrencia, rollback y límites arquitectónicos. Se reutiliza la evidencia v4 de SEC-01/03..08/10 por no alterar su superficie.
- Persisten los riesgos operacionales de Redis/HMAC/proxy confiable y disponibilidad PostgreSQL; Redis se mantiene fail-closed. No se revalidó la purga/retención de digests porque está fuera del diff v5.
