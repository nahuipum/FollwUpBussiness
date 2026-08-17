# BE-013 — Handoff de Desarrollo

**Estado:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD dde8160cc7cd249cb7bab8def95f700487789086 + dbb4655c`.

## Alcance

Se corrigió el límite modular y se conservó la atomicidad cliente–auditoría.
`CustomerConfiguration` consume el puerto `RecordAuditEntryUseCase` calificado
como transaccional; la composición de ese puerto reside en `audit` y usa el
mismo `JdbcTemplate`. El puerto general queda `@Primary`, por lo que no cambia
la inyección de los demás módulos. La integración de clientes aporta el bean
transaccional equivalente y continúa verificando rollback de ambas escrituras.

Archivos: `audit/config/AuditConfiguration.java`,
`customers/config/CustomerConfiguration.java` y
`customers/persistence/CustomerCreationTransactionIntegrationTest.java`.
No cambiaron contratos, migraciones ni reglas de negocio.

## Verificación

- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=ModuleBoundaryTest,CustomerCreationTransactionIntegrationTest,FollowupbussinessApplicationTests" test`: PASS.
- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" clean verify`: PASS (212 s).
- `git diff --check`: PASS.

Criterios cubiertos: no dependencia de `customers` hacia adaptadores internos
de `audit`; auditoría y cliente revierten juntos ante fallo de commit; el
contexto Spring arranca sin ambigüedad. Riesgo residual: ninguno identificado.
Reproducción: ejecutar el `clean verify` anterior desde `backend/followupbussiness`.
