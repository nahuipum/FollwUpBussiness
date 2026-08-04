# Backend Handoff — BE-051 v2

## Estado

`READY_FOR_HANDOFF`

## Alcance implementado

- Dominio `audit` independiente: evidencia inmutable de acción crítica con empresa, actor técnico, acción controlada, recurso, resultado, correlación, alcance y hora de servidor.
- Puerto de aplicación y adaptador JDBC append-only. La repetición del mismo `audit_entry.id` no crea otra entrada.
- Política de minimización: los cambios anterior/posterior solo admiten el campo `status` y valores de estado en mayúsculas; se rechazan claves o valores no permitidos.
- Purga programada diaria, física, idempotente y en lotes de hasta 500: 90 días para `audit_network_context` y 365 para `audit_entry`.
- No se agregó endpoint ni contrato OpenAPI: BE-051 no define una interfaz pública y no se debe anticipar la lectura de BE-052. Por tanto, no existe una ruta que acepte un tenant no confiable ni que otorgue acceso por una entrada de auditoría.

## Archivos

- Dominio, aplicación, puertos, JDBC, scheduler y configuración: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/audit/`.
- Migración: `backend/followupbussiness/src/main/resources/db/migration/V8__create_audit_entries.sql`.
- Pruebas dirigidas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/audit/`.

## Contratos y migraciones

- Sin cambio a `docs/api/openapi.yaml`; no hay superficie REST nueva.
- `V8` crea `audit_entry` con restricciones de acción/resultado/campos saneados e índices tenant/fecha, actor, acción y recurso.
- `audit_network_context` mantiene la misma empresa que su entrada mediante FK compuesta; no tiene adaptador de lectura o escritura pública.

## Matriz criterio → evidencia

| Criterio | Evidencia implementada | Estado de ejecución |
|---|---|---|
| BE051-AC-01 | `AuditEntry`, `AuditAction`, `AuditResult`, `V8` | PASS: `AuditEntryMigrationTest`. |
| BE051-AC-02 | Allowlist `status`, regex de valores y `CHECK` JSONB en `V8`; `AuditEntryTest` | PASS. |
| BE051-AC-03 | `JdbcAuditEntryStore.append` con `ON CONFLICT DO NOTHING`; no hay actualización/eliminación ordinaria | PASS: reintento idempotente. |
| BE051-AC-04 | `PurgeAuditRetention`, scheduler y tablas/índices de `V8`; prueba de corte exacto | PASS: migración limpia PostgreSQL y retención 90/365. |
| BE051-SEC-01 | Tenant obligatorio, índices tenant, FK compuesta de red; sin endpoint ni consulta que otorgue acceso | PASS: restricciones de migración y arquitectura. |
| BE051-OBS-01 | Campos de acción/resultado/recurso/correlación; métricas saneadas de purga | PASS: persistencia integrada. |
| BE051-CON-01 | PK idempotente, `ON CONFLICT`, `FOR UPDATE SKIP LOCKED`, lotes ≤500 y caso concurrente añadido | PASS: concurrencia integrada. |

## Comandos y resultados

- Diagnóstico: el classpath efectivo contenía `target/classes`, pero las clases obsoletas de `target/test-classes` precedían las de producción. `mvn clean` fue bloqueado por el sandbox al borrar el directorio generado; la limpieza limitada de `target` y la ejecución se completaron con autorización.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" clean test "-Dtest=AuditEntryTest,AuditEntryMigrationTest"`: ejecutó `testCompile`; reveló y permitió corregir el serializador JSON de cambios.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=AuditEntryTest,AuditEntryMigrationTest"`: PASS, 4 pruebas; PostgreSQL 17.5/Testcontainers, Flyway V1–V8, idempotencia y concurrencia.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest"`: PASS, 4 pruebas.
- `git diff --check`: PASS al cierre.
- `graphify update .`: PASS; grafo actualizado tras el cambio de código.

## Candidato reproducible

- Base: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384`.
- Diff de trabajo requerido: los archivos Backend listados arriba, más el diff documental ya fijado por el paquete. No hay commit, PR ni CI solicitados.

## Riesgos residuales

- La limpieza de `target` corrige el classpath de artefactos generados; no requirió cambio de POM ni debilitó pruebas.
- Residual: las categorías concretas de acciones y futuros campos permitidos requieren ampliación explícita de la allowlist por un cambio trazado; no se aceptan campos arbitrarios.
- No se registran secretos, tokens, payloads completos, correos, coordenadas ni IP en telemetría. La tabla de red queda restringida y sin API pública.

## Excepción de fuentes primarias

No se releyó ninguna fuente primaria trazada por el paquete v2.

## Remediación de Seguridad v3

- `SEC-BE051-001`: `V9__secure_audit_privileges.sql` introduce roles `audit_owner`, `audit_writer` y `audit_purger`; revoca acceso público, limita el writer a `INSERT`, niega lectura de `audit_network_context`, aplica triggers append-only y expone purga solo mediante funciones `SECURITY DEFINER` con `FOR UPDATE SKIP LOCKED`. `JdbcAuditEntryStore` invoca esas funciones, no `DELETE` directo.
- `SEC-BE051-002`: `RecordAuditEntryCommand` ya no contiene hora; `RecordAuditEntry` usa `Clock` confiable.
- `SEC-BE051-003`: el comando ya no acepta tenant, actor, correlación ni alcance. `SecurityContextAuditTrustedContextProvider` los deriva del `AuthenticatedActor` validado; acción, recurso y alcance son enums cerrados.
- Archivos adicionales: `audit/application/RecordAuditEntryCommand.java`, `AuditTrustedContext.java`, `port/out/AuditTrustedContextProvider.java`, `audit/domain/AuditResourceType.java`, `AuditScope.java`, `adapter/out/security/SecurityContextAuditTrustedContextProvider.java`, `V9__secure_audit_privileges.sql` y `RecordAuditEntryTest.java`.
- Comandos: `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=AuditEntryTest,AuditEntryMigrationTest,RecordAuditEntryTest"` PASS (7); `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest"` PASS (4); `git diff --check` PASS.
- Evidencia negativa: writer no puede leer IP ni borrar evidencia; purger no puede borrar directamente y solo puede invocar la función de purga. Las pruebas de comando verifican procedencia de tenant/actor/correlación/alcance/hora y vocabulario de recurso.
- Candidato v3: `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` más el diff Backend y documental vigente; sin commit, PR ni CI. No se releyeron fuentes primarias.

## Remediación SEC-BE051-004 v4

- `AuditDatabaseProperties` exige dos URLs, usuarios y contraseñas distintos; `AuditConfiguration` instancia `JdbcTemplate` separados para writer y purger. No hay fallback al datasource de Flyway/migrador.
- `JdbcAuditEntryStore` recibe ambos datasources: inserta solo con writer e invoca las funciones privilegiadas únicamente con purger. Las identidades operativas deben ser LOGIN distintos, miembros respectivamente de `audit_writer` y `audit_purger`; secretos se suministran por configuración externa y no se versionan.
- Rutas modificadas: `audit/config/AuditDatabaseProperties.java`, `audit/config/AuditConfiguration.java`, `audit/adapter/out/persistence/JdbcAuditEntryStore.java`.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=AuditEntryTest,AuditEntryMigrationTest,RecordAuditEntryTest"`: PASS, 7 pruebas (PostgreSQL 17.5/Testcontainers/Flyway V1–V9), incluyendo denegaciones writer/purger e IP.
- Candidato v4: base `03cddd578850f77acd1a1d1035fef031f7ac7384` + manifest v4 y las rutas anteriores; sin commit/PR/CI. `git diff --check` sigue PASS. Estado: `READY_FOR_HANDOFF`.

## Remediación SEC-BE051-004 v5

- Eliminado `JdbcAuditEntryStore(JdbcTemplate)`; el store exige writer y purger explícitos. `AuditDatabaseProperties` rechaza usuario o URL iguales, impidiendo fallback, identidad compartida o datasource Flyway/general reutilizado.
- `AuditEntryMigrationTest.dedicatedLoginIdentitiesUseTheirOwnDatasourceForAppendAndPurge` crea logins PostgreSQL distintos, verifica `current_user`, append por writer, purge por purger y denegaciones de IP/delete directo. PASS: `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=AuditEntryMigrationTest"` (5).
- Rutas v5: `JdbcAuditEntryStore.java`, `AuditDatabaseProperties.java`, `AuditEntryMigrationTest.java`, este handoff. Candidato: HEAD `03cddd578850f77acd1a1d1035fef031f7ac7384` + manifest v5/diff vigente; sin secretos versionados, commit, PR ni CI. Estado: `READY_FOR_HANDOFF`.

## Remediación SEC-BE051-005 v7

- `V9__secure_audit_privileges.sql` elimina parámetros de las funciones `SECURITY DEFINER`: PostgreSQL calcula los cortes internos de 90/365 días y aplica `LIMIT 500`. El adaptador solo invoca wrappers sin argumentos.
- Integración PASS: `AuditEntryMigrationTest` (5) incluye login purger real y rechazo de `audit_purge_entries('infinity', 501)`; no existe una capacidad SQL expuesta para ampliar corte/lote. Candidato v7: HEAD `03cddd578850f77acd1a1d1035fef031f7ac7384` + diff/manifest vigente; sin commit/PR/CI. Estado `READY_FOR_HANDOFF`.
