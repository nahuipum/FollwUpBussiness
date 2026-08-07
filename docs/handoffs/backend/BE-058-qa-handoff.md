# BE-058 — QA Backend: remediación de aislamiento CI

- **Estado:** `PASS`
- **Candidate-ID:** `HEAD d6c3460b54ef8223531b1672e233ababb95a8424 + test-isolation 329a72f4e739`.
- **Firma validada:** `HEAD` coincide. El único delta BE-058 evaluado es `CompanyUserControllerTest`; los demás cambios locales son ajenos y se preservaron.
- **Alcance:** solo pruebas; no se reabrieron producción, contratos, migraciones ni arquitectura.

## Matriz resumida

| Criterio | Implementación | Prueba/evidencia | Resultado |
|---|---|---|---|
| Actor aislado por prueba | `@BeforeEach` instala `COMPANY_ADMIN` y `@AfterEach` limpia `SecurityContext` | Ejecución junto a `LogoutControllerTest`, que deja `SELLER` | PASS |
| Rutas por ID conservan actor | Stubs y verificaciones usan el actor fijado en `get`, `update` y `status` | 3 rutas HTTP 200; 5 pruebas de controller | PASS |
| Paginación y filtros sin deriva | `list` verifica exactamente `page`, `pageSize`, `search`, `role`, `status` y actor | Respuesta paginada y verificación Mockito | PASS |
| Negativos de entrada permanecen sin caso de uso | Pruebas existentes mantienen `verifyNoInteractions` | UUID/JSON inválidos: 400, sin interacción | PASS |

## Evidencia

- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=LogoutControllerTest,CompanyUserControllerTest" test` — PASS: 11 pruebas, 0 fallos, 0 errores, 0 omitidas.
- Informes Surefire: `LogoutControllerTest` 6 PASS; `CompanyUserControllerTest` 5 PASS.
- `git diff --check` — PASS.
- Intentos no ejecutados: `mvnw.cmd` no pudo iniciar y `mvn` sin repositorio explícito apuntó a `C:\.m2`; no son fallos del candidato.

## Hallazgos, regresión y riesgo residual

- Hallazgos abiertos: ninguno.
- Regresión relevante: la combinación contaminante conocida pasa con el actor aislado; la clase de logout conserva sus 6 pruebas.
- Riesgo residual bajo: la evidencia dirigida cubre la contaminación conocida; `verify` completo y SCA quedan para CI.

## Siguiente fase autorizada

- Seguridad final, conforme al flujo posterior a QA `PASS`.
