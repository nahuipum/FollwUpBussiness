# QA Backend Handoff — BE-051

## Estado

`PASS`

## Candidato y trazabilidad

- Base verificada: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` (sin cambio durante QA).
- Candidato: worktree con ADR-016/020, módulo `audit`, migración V8 y pruebas `audit`; sin commit, PR ni CI solicitados por el paquete v3.
- Handoff Dev v2: SHA-256 `7391469209597f639605b48c1e20158f6ffe7a3750aede511cc6538a4adbd783`, coincide con el paquete.
- ADR-016 y ADR-020: SHA-256 `2d281cfaf7f4085d0ec93705c01686737faeebe9c7bb36e9e786837eb385815d` y `68db79d4aa168a3adce85a23c24a0b59a31496dda8deba01f73b225ca7b299be`, respectivamente; coinciden con el paquete.
- El paquete declara manifest `8db12091…6423ca`, pero no publica inventario ni método de composición para recalcularlo. Se verificaron base, alcance y huellas individuales disponibles; no hubo evidencia de modificación del candidato durante la revisión. Riesgo residual de trazabilidad, no fallo funcional.

## Matriz resumida

| Criterio | Implementación revisada | Prueba/evidencia QA | Resultado |
|---|---|---|---|
| BE051-AC-01 | `AuditEntry`, enums y V8 exigen tenant, actor, acción, recurso, resultado, correlación, alcance y `occurred_at`. | `AuditEntryMigrationTest`; migración Flyway V1–V8 limpia sobre PostgreSQL 17.5. | PASS |
| BE051-AC-02 | Allowlist exclusiva `status`, regex `[A-Z_]{1,64}`, copia inmutable y `CHECK` JSONB de claves. | `AuditEntryTest.rejectsNonAllowlistedOrPotentiallySensitiveChangeData`; PASS. | PASS |
| BE051-AC-03 | Solo `INSERT ... ON CONFLICT DO NOTHING`; sin puerto/API de actualización o eliminación ordinaria. | Prueba de doble append y revisión de `JdbcAuditEntryStore`. | PASS |
| BE051-AC-04 | `PurgeAuditRetention`: 90/365 días, corte estricto `<`, lotes de 500 hasta agotar; scheduler diario. | Prueba de 91/366 días, preserva exactamente 365, orden red→entry e idempotencia de segunda purga. | PASS |
| BE051-SEC-01 | `tenantId` obligatorio; índices tenant; FK compuesta `(audit_entry_id, tenant_id)` para red; sin REST/OpenAPI nuevo. | Migración integrada y búsqueda de adaptadores: no hay ruta pública ni consulta de lectura del módulo. | PASS |
| BE051-OBS-01 | Campos requeridos en entry; contadores de purga sin datos personales. | Revisión de dominio/configuración y prueba de persistencia. | PASS |
| BE051-CON-01 | PK + `ON CONFLICT`, `FOR UPDATE SKIP LOCKED`, límite constante 500 y bucle por lotes. | Dos reintentos concurrentes persisten una sola fila; prueba limpia integrada PASS. | PASS |
| Arquitectura | Dominio sin framework; aplicación depende de puerto; adaptador JDBC y configuración separados; módulo registrado. | `HexagonalArchitectureTest`, `ModuleBoundaryTest`; 4 pruebas PASS. | PASS |

## Comandos y evidencia

- `mvn clean "-Dmaven.repo.local=C:\\tmp\\followup-m2" "-Dtest=AuditEntryTest,AuditEntryMigrationTest,HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 8 pruebas. Compilación limpia; PostgreSQL 17.5/Testcontainers; Flyway aplica V1–V8.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" "-Dtest=AuditEntryTest,AuditEntryMigrationTest" test`: PASS, 4 pruebas. La primera ejecución dentro del sandbox quedó `NOT_EXECUTED` para integración por denegación del pipe Docker; la ejecución autorizada fuera del sandbox aportó la evidencia PASS.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest" test`: PASS, 4 pruebas.
- `git diff --check` y `git diff --no-index --check NUL .../V8__create_audit_entries.sql`: PASS.
- Inspección dirigida de puertos/adaptadores y referencias externas: el nuevo `RecordAuditEntryUseCase` no expone transporte ni se conecta a tablas internas de otros dominios.

## Hallazgos

No hay hallazgos que requieran cambio.

## Regresión relevante y riesgos residuales

- No hay PR ni CI para reutilizar: el candidato es un worktree no versionado, según el paquete; se ejecutaron pruebas locales limpias dirigidas como evidencia nueva.
- La prueba integrada cubre concurrencia del mismo ID y una purga con tres entradas. El comportamiento de más de 500 filas se verifica por la constante `MAX_BATCH_SIZE=500` y el bucle hasta lote parcial; no se añadió prueba QA por restricción de no modificar pruebas.
- La autorización por recurso y el tenant derivado de identidad no tienen superficie de entrada en BE-051: no se añadió endpoint. La integración de productores concretos de auditoría permanece fuera del alcance entregado; Seguridad debe revisar este límite conforme al plan del paquete.
- El manifest declarado carece de inventario y algoritmo de composición; la fijación se corroboró por base, rutas y hashes de fuentes declaradas, pero no se puede recalcular el fingerprint compuesto de forma independiente.

## Excepciones de fuentes primarias

Ninguna. Se usaron exclusivamente el paquete v3, handoff Dev v2, candidato y código/pruebas afectados. No se releyeron las fuentes primarias trazadas.
