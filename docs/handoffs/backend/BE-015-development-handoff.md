# BE-015 — Handoff de Desarrollo

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `HEAD ef3804e + diff da53191e`.

## Alcance

Implementado `POST /customers/duplicate-checks` en Clientes: autorización exclusiva `COMPANY_ADMIN` y tenant derivado únicamente de sesión; consulta de solo lectura sin auditoría, eventos, cola ni escrituras. Rechazos de roles no autorizados no consultan el puerto. `excludeCustomerId` se filtra dentro del tenant.

La consulta JDBC aplica normalización `trim`/minúsculas y elimina espacios/guiones para documento/teléfono. Usa PostGIS `ST_DWithin(...::geography, ..., 100)` con punto WGS84/SRID 4326. Devuelve candidatos del tenant, campos coincidentes y `score = matchedFields/5`.

## Archivos y contratos

- Caso de uso, puerto, adaptador y wiring: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/customers/`.
- REST: `adapter/in/rest/CustomerController.java`.
- Pruebas: `CheckCustomerDuplicatesServiceTest.java`, `CustomerControllerTest.java`, `JdbcCustomerStoreDuplicateCheckIntegrationTest.java`.
- Sin migraciones; se usa la extensión/índice PostGIS ya existente. El contrato actualizado en `docs/api/openapi.yaml` no fue modificado por Desarrollo.

## Evidencia

- `mvn -q -Dtest=CheckCustomerDuplicatesServiceTest,CustomerControllerTest,JdbcCustomerStoreDuplicateCheckIntegrationTest test` — PASS.
- `git diff --check` — PASS.
- `mvn -q clean verify` superó 124 s sin fallo; una continuación `mvn -q verify` fue detenida por límite operativo mientras seguían integraciones Testcontainers. No hay veredicto completo de CI local.

Cobierto: coincidencias/score, normalización, radio PostGIS, exclusión, aislamiento tenant y denegación. Riesgo residual: completar `clean verify` en CI o entorno sin límite temporal antes del cierre.

**Reproducción:** ejecutar el comando focalizado anterior desde `backend/followupbussiness`.
