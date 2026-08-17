# BE-013 — Handoff de Desarrollo

**Estado:** READY_FOR_HANDOFF  
**Candidate-ID:** Pendiente de cálculo por Orquestación.

## Alcance de remediación

Se corrigió exclusivamente la atomicidad cliente–auditoría. `CustomerConfiguration` construye la auditoría de creación con el mismo `JdbcTemplate` de la transacción del cliente; ya no usa el escritor de auditoría con `DataSource` independiente. Así, inserción de `customer` y evidencia `CUSTOMER/SUCCESS` se confirman o revierten juntas.

Archivos modificados: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/config/CustomerConfiguration.java` y `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/customers/persistence/CustomerCreationTransactionIntegrationTest.java`. No cambiaron contratos, migraciones ni reglas de negocio.

## Verificación

- `mvn -q -Dtest=CustomerCreationTransactionIntegrationTest test`: PASS.
- `mvn -q "-Dtest=CreateCustomerServiceTest,CustomerControllerTest,CustomerCreationTransactionIntegrationTest" test`: PASS.
- La nueva integración provoca una FK diferida inválida al confirmar, después de escribir auditoría, y verifica cero filas en `customer` y cero auditorías exitosas `CUSTOMER`.
- `mvn -q clean verify`: no concluyente por timeout local (124 s), sin error emitido; se reutiliza el `clean verify` PASS previo y QA debe conservar esta limitación.

Criterio cubierto: fallo/commit posterior a auditoría no deja efectos parciales. Riesgo residual: validación completa no se completó en esta ejecución; cambios sin commit. Reproducción: ejecutar la segunda prueba focalizada anterior.
