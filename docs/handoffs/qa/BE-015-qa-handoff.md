# BE-015 — Handoff QA

**Estado:** `PASS`  
**Candidate-ID:** `HEAD ef3804e + diff da53191e`.

## Cobertura y evidencia

- Candidatos, `matchedFields` y `score`: el caso de uso calcula campos/5 y el REST expone sólo el resultado; prueba de aplicación y controlador PASS.
- Tenant, exclusión y proximidad: el adaptador filtra siempre por `tenant_id`, exclusión en la misma consulta y `ST_DWithin(...::geography, ..., 100)`; integración PostGIS PASS, incluido otro tenant y exclusión.
- Vacío y ausencia de efectos: lectura exclusiva mediante `findDuplicateMatches`, sin puertos de auditoría/eventos/colas ni escrituras; una lista vacía produce 200 informativo.
- Autorización y validación: sólo `COMPANY_ADMIN` llega al puerto; roles/no actor se deniegan sin consulta. Bean Validation y `@JsonAnySetter` devuelven 400 para request incompleto, WGS84 inválido o propiedad desconocida; rechazo de negocio devuelve 422 y la correlación es UUID sin datos de solicitud.
- Privacidad: no se añadieron logs; la respuesta y evidencia no incorporan coordenadas completas fuera del payload autorizado.

## Comandos

- `mvn -q '-Dtest=CheckCustomerDuplicatesServiceTest,CustomerControllerTest,JdbcCustomerStoreDuplicateCheckIntegrationTest' test` — PASS (9 pruebas; incluye Testcontainers/PostGIS).
- `git diff --check` — PASS.

## Hallazgos y riesgos

Sin hallazgos reproducibles. Riesgo residual: `clean verify` no tiene veredicto local por límite operativo previo; completar CI equivalente antes de release. No hay regresión directa observada.
