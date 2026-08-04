# QA Handoff — BE-051 v5

## Estado

`PASS`

## Candidato y alcance

- Paquete: `BE-051-context-package-v7.md`.
- Base: `03cddd578850f77acd1a1d1035fef031f7ac7384` más el diff no versionado fijado.
- Verificación obligatoria v7: agregado SHA-256 de 28 rutas `4d23aad32d2cb2855a6060e20c83b5fc206cbd8e400d6c7b3b9f715441d416e5`; coincide.
- Handoffs revisados: Desarrollo v2, QA v3 y Seguridad previa. La ruta indicada para QA v4 no existe en el candidato; v7 declara que su estado `BLOCKED` queda reemplazado por la corrección de reproducibilidad.

## Matriz resumida

| Criterio | Implementación inspeccionada | Prueba / evidencia | Estado |
|---|---|---|---|
| AC-01 evidencia auditada y tenant | `AuditEntry`, V8, `JdbcAuditEntryStore` | `AuditEntryMigrationTest`: persistencia con tenant | PASS |
| AC-02 minimización y datos sensibles | allowlist `status`, regex y `CHECK` JSONB V8 | `AuditEntryTest` rechaza clave/valor sensibles | PASS |
| AC-03 append-only e idempotencia | PK, `ON CONFLICT DO NOTHING`, V9 triggers | reintento y concurrencia en `AuditEntryMigrationTest` | PASS |
| AC-04 / CON retención | `PurgeAuditRetention`, funciones V9 `SKIP LOCKED`, lotes 500, scheduler diario | corte exacto, orden red→entrada e idempotencia | PASS |
| SEC-01 / OBS | FK compuesta tenant; sin REST; métricas sólo contadores | migración y pruebas dirigidas | PASS |
| SEC-02/03 | `Clock` y `AuditTrustedContextProvider`; comando con vocabularios cerrados | `RecordAuditEntryTest` | PASS |
| SEC-004 separación de credenciales | constructor exige writer/purger; configuración crea dos datasources dedicados y valida URL/usuario no iguales; V9 roles/privilegios | login writer/purger reales, `current_user`, append/purge y denegaciones de lectura IP/delete directo | PASS |
| Arquitectura | dominio/aplicación/adaptador/config, puertos explícitos | `HexagonalArchitectureTest`, `ModuleBoundaryTest` | PASS |

## Comandos y evidencia

- Comando PowerShell literal del paquete v7: hash coincidente indicado arriba.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" clean test "-Dtest=AuditEntryTest,AuditEntryMigrationTest,RecordAuditEntryTest"`: PASS, 8 pruebas; PostgreSQL 17.5/Testcontainers y Flyway V1–V9. La ejecución limpia requirió permiso fuera del sandbox porque éste bloqueó el borrado de `target`.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest"`: PASS, 4 pruebas.
- `git diff --check`: PASS.
- Consulta Graphify: NOT_EXECUTED; el entorno denegó el acceso a `python.exe` antes de iniciar la consulta. No afecta la evidencia de pruebas o la decisión QA.

## Hallazgos

No se identificaron hallazgos bloqueantes ni de cambios requeridos.

## Regresión relevante y riesgos residuales

- Regresión dirigida cubierta: migración limpia V1–V9, idempotencia bajo concurrencia, retención y controles de privilegios con identidades LOGIN distintas.
- Riesgo residual: no hay evidencia de operación de backup/restore ni de comportamiento del scheduler con múltiples instancias; son `NOT_EXECUTED` y no están en el diff funcional validado. La configuración productiva debe suministrar credenciales externas distintas para writer y purger.
