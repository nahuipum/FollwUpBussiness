# BE-009 — Development handoff

Estado: `READY_FOR_HANDOFF`

## Remediación QA

Se retiró `V28__enforce_unique_seller_employee_code.sql`: no hay migración que cree un índice único ni que falle, modifique o elimine datos históricos con `employeeCode` repetidos.

El rechazo atómico de duplicados aplicables se preserva sin nueva regla de negocio. Al recibir un `employeeCode` no vacío, el adaptador PostgreSQL adquiere un bloqueo asesor transaccional por `(tenantId, código normalizado)`, verifica el duplicado tenant-scoped y realiza la escritura con versión esperada dentro de la misma transacción. Dos actualizaciones concurrentes del mismo código se serializan; la segunda observa el cambio y obtiene 409. Actualizar solo nombre/teléfono no bloquea ni rechaza registros históricos ya duplicados. No se expone PII en auditoría.

## Archivos

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/application/{SellerService.java,port/out/SellerStore.java}`
- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/adapter/out/persistence/JdbcSellerStore.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/application/SellerUpdateServiceTest.java`

No quedan migraciones BE-009. Se mantienen el controlador, `If-Match`, autorización, aislamiento tenant, preservación de relaciones y auditoría ya implementados.

## Evidencia

- `mvn -q clean '-Dtest=SellerUpdateServiceTest' test` — PASS.
- La suite completa `mvn -q verify` del candidato anterior fue PASS; esta remediación no altera composición compartida ni contrato.
- `git diff --check` — PASS.

La prueba focalizada cubre éxito, preservación, roles/tenant, versión obsoleta, duplicado sin escritura/auditoría y adquisición del bloqueo antes del rechazo. Riesgo residual: las colisiones de hash del bloqueo solo serializan indebidamente códigos distintos; no permiten duplicados ni pérdida de datos.
