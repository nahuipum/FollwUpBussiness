# QA Handoff — BE-051 regresión v4

## Estado

`CHANGES_REQUIRED`

## Candidato y verificación

- Base `HEAD 03cddd578850f77acd1a1d1035fef031f7ac7384` + manifest v4.
- Se verificaron los 27 hashes y el agregado `d4c5e5938b18c8f0630c6a8fa980599252b1a1bd64c1d2daedacbbbb2bb08bf8` mediante líneas UTF-8 `path<TAB>hash`, LF y sin LF final.
- PR/CI: inexistentes; worktree delimitado por manifest.

## Matriz

| Criterio | Evidencia | Resultado |
|---|---|---|
| AC-01/OBS-01 | Contexto confiable y `Clock`; 7 pruebas audit limpias | PASS |
| AC-02 | Allowlist `status`/valores; `AuditEntryTest` | PASS |
| AC-03/SEC-001 | V9 roles/grants/triggers/funciones; prueba solo tras asumir rol | FAIL — SEC-BE051-004 |
| AC-04/CON-01 | Clock, corte, lote 500, `SKIP LOCKED`; migración | PASS |
| SEC-002 | Hora excluida del comando y dada por Clock | PASS |
| SEC-003 | Tenant/actor/correlación/scope derivado y enums cerrados | PASS |
| Arquitectura | ArchUnit | PASS, 4/4 |

## Pruebas

- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" clean test "-Dtest=AuditEntryTest,AuditEntryMigrationTest,RecordAuditEntryTest"`: PASS, 7/7, PostgreSQL 17.5/Testcontainers/Flyway V1–V9.
- `mvn "-Dmaven.repo.local=C:\\tmp\\followup-m2" test "-Dtest=HexagonalArchitectureTest,ModuleBoundaryTest"`: PASS, 4/4.
- `git diff --check`: PASS.

## Hallazgo

### SEC-BE051-004 — separación de privilegios no operable

**Severidad:** Medium. V9 crea `audit_writer` y `audit_purger` `NOLOGIN`, pero
no los asigna al usuario real de runtime ni configura credenciales/datasources
diferenciados. `AuditConfiguration` entrega el mismo `JdbcTemplate` a append y
purge, y Flyway usa ese datasource. La prueba usa el administrador del
contenedor y `SET ROLE`: demuestra permisos del rol asumido, no el principal
real. Un runtime no elevado no puede escribir/purgar; uno elevado sigue siendo
migrador/runtime y conserva separación insuficiente.

**Corrección requerida:** configurar identidades separadas y asignación segura
de roles/datasources para migrador, writer y purger; demostrar por prueba la
identidad de runtime, la denegación de update/delete/IP y la invocación de purge
solo por el principal dedicado.

## Riesgos

SEC-002/003 quedan corregidos en el módulo. No hay productor real ni endpoint,
conforme al alcance. El principal runtime y la separación migrador/writer/purger
siguen sin probar; no avanzar a Seguridad.
