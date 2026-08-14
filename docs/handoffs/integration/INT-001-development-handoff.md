# INT-001 — Handoff de Desarrollo

- **Estado:** `READY_FOR_HANDOFF`
- **Candidate-ID:** `e01c35c+0061cef1e255`
- **Alcance:** remediación de `INT001-QA-01` para detalle de empresa de plataforma.

## Causa y solución

El OpenAPI publicaba `GET /platform/companies/{companyId}`, pero el controlador no tenía mapeo ni flujo de aplicación/persistencia, por lo que Spring devolvía `404`. Se añadió `GetCompanyUseCase`/`GetCompanyService`, `CompanyDetailStore` JDBC y el mapeo REST. La autorización exige `PLATFORM_SUPERADMIN` sin tenant antes de consultar; no se reutilizó la consulta tenant `ACTIVE`, para conservar el alcance del listado de plataforma.

## Archivos y contratos

- Backend: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/tenancy/...` y pruebas asociadas.
- Sin migraciones ni cambios de `docs/api/openapi.yaml`; se implementa el contrato existente.

## Verificación

- `mvn -q -Dtest=CompanyControllerTest,GetCompanyServiceTest,CompanyCreationTransactionTest test`: PASS (HTTP post→detalle→listado, 404, denegación; JDBC en PostgreSQL efímero).
- `mvn -q clean verify`: PASS.
- `git diff --check`: PASS.

Cobertura directa: ID creado recuperable y consistente con listado; inexistente `404`; superadmin ligado a tenant `403` sin lectura. QA previa mantiene la reproducción directa de login, alta, listado, invitación y conflicto. Riesgo residual: ninguno identificado; no se modificó aislamiento, migraciones ni OpenAPI.

Nota de trazabilidad: el digest cubre cambios rastreados y archivos backend nuevos; no hubo cambios de código ni contrato tras esta entrega.
