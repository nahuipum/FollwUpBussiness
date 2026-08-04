# QA Handoff — BE-051 final v5

## Estado

`CHANGES_REQUIRED`

## Evidencia

- Manifest v5 reconstruido: 28 archivos, 0 hashes distintos, agregado `20ac06dc9e5b27c5401e375893d5013f9248a95b2d2a871f972b51a44af3cc53`.
- 7 pruebas audit limpias con PostgreSQL 17.5/Testcontainers/Flyway V1–V9: PASS.
- 4 pruebas ArchUnit: PASS. `git diff --check`: PASS.
- AC-01/02/03/04, OBS, CON, SEC-001/002/003: PASS; SEC-004: FAIL.

## Hallazgo SEC-BE051-004 — Medium

La separación de writer/purger no es obligatoria ni está demostrada:

- `JdbcAuditEntryStore(JdbcTemplate writer)` delega a `this(writer, writer)` y
  permite que append/purge usen el mismo principal; la integración lo usa.
- La validación solo distingue usernames no nulos: no exige URLs distintas ni
  prohíbe reutilizar datasource general/Flyway.
- No hay prueba con logins writer/purger reales; las pruebas asumen roles desde
  el migrador/Testcontainers.

**Corrección requerida:** eliminar el constructor de un `JdbcTemplate`, validar
segregación efectiva de URL/usuario frente a datasource/Flyway y añadir
integración con logins independientes que pruebe identidad, denegaciones y uso
del datasource dedicado por cada operación.

## Riesgos

Las once pruebas actuales no cubren esta condición de seguridad. Permanece
riesgo de ejecutar con credencial migradora/general o compartir identidad de
escritura/purga. Sin commit, PR ni CI.
