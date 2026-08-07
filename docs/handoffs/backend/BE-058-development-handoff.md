# BE-058 — Remediación Backend CI ApplicationContext

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `HEAD 4320f3325ca53ad2c5e9d3769ba018222171b6bc + ci-context-fixture bb5fb5d`
- **Alcance:** fixture de prueba mínimo para los contextos que CI no pudo cargar; sin cambio de producción ni de los controles funcionales BE-058.

## Causa y cambio

Los tres errores comparten causa: `CompanyUserController` se registra en los contextos de prueba con `DataSourceAutoConfiguration` excluida y requiere `CompanyUserService`, que no es un bean en ese fixture. `SecurityConfigurationTest` ya lo suplía mediante `@MockitoBean`; se declara el mismo mock únicamente en `FollowupbussinessApplicationTests` y `PrometheusMetricsEndpointTest`.

## Archivos, contratos y migraciones

- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/FollowupbussinessApplicationTests.java`; `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/config/PrometheusMetricsEndpointTest.java`.
- Producción, contratos y migraciones: sin cambios.

## Evidencia

- Log CI run `31143556396`, job `92758287149`: `NoSuchBeanDefinitionException` de `CompanyUserService` al construir `CompanyUserController`; el segundo error de la clase de aplicación es el umbral posterior del mismo fallo.
- `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository" "-Dtest=FollowupbussinessApplicationTests,PrometheusMetricsEndpointTest" test` — PASS (3 pruebas): carga de contexto, ausencia de bootstrap y endpoint Prometheus.
- `git diff --check` — PASS antes de actualizar este handoff.

## Riesgo y siguiente fase

Riesgo residual bajo: la cobertura dirigida confirma los dos fixtures aislados; `Maven verify` completo y SCA quedan para CI. Siguiente fase: QA afectado, validando el Candidate-ID y los tres escenarios de contexto.
