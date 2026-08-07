# BE-058 — Remediación final CI de `CompanyUserControllerTest`

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `HEAD d6c3460b54ef8223531b1672e233ababb95a8424 + test-isolation 329a72f4e739`
- **Alcance:** aislamiento determinista de `CompanyUserControllerTest`; sin producción, contrato ni migraciones.

## Consolidación contrato → defecto → prueba

- Contrato: `@AuthenticationPrincipal` debe entregar al caso de uso el actor autenticado; lista conserva exactamente `page`, `pageSize`, `search`, `role` y `status`.
- Defecto reproducible: el job `31144503460`/`92761066338` ejecuta `LogoutControllerTest` antes de esta clase y deja un `SELLER` en `SecurityContext`; los tests suponían actor `null`, por lo que fallan la verificación de rutas y el stub de lista devuelve cuerpo vacío.
- Cierre: cada prueba fija un `COMPANY_ADMIN` propio en `SecurityContext`, lo limpia con `@AfterEach` y verifica actor/filtros enviados al servicio.

## Archivos y evidencia

- Prueba: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/adapter/in/rest/CompanyUserControllerTest.java`.
- Contratos/migraciones/producción: sin cambios.
- `mvnw.cmd -q -Dtest=CompanyUserControllerTest test` — PASS (5 pruebas).
- `mvnw.cmd -q '-Dtest=LogoutControllerTest,CompanyUserControllerTest' test` — PASS (11 pruebas); combinación mínima con la clase que deja el contexto residual.
- `git diff --check` — PASS.

## Riesgo y siguiente fase

Riesgo residual bajo: se valida la contaminación concreta y el aislamiento del actor; `Maven verify` y SCA completos quedan para CI. Siguiente fase: QA afectado sobre el mismo Candidate-ID.
