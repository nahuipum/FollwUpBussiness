# INT-001 — Paquete de contexto

- **Candidate-ID:** `e01c35c+0061cef1e255`
- **Estado previo:** QA `CHANGES_REQUIRED` por `INT001-QA-01`.
- **Alcance de remediación:** `GET /platform/companies/{companyId}`.

## Contrato e invariantes

- Actor: únicamente `PLATFORM_SUPERADMIN` sin `tenantId`; sin credencial `401`, actor fuera de ámbito `403` sin consulta.
- Éxito: el ID retornado por `POST /platform/companies` permite `GET` inmediato `200`; detalle y listado representan la misma empresa.
- Ausencia: UUID no existente devuelve `404` neutral, sin escrituras.
- Persistencia: detalle consulta empresa y configuración por UUID, incluido estado no activo, igual que el alcance de plataforma del listado.
- Puertos alcanzables: REST → `GetCompanyUseCase` → `CompanyDetailStore` → JDBC/PostgreSQL. No hay migración, evento ni cambio OpenAPI.

## Causa y decisión

La ruta estaba declarada en `docs/api/openapi.yaml`, pero no había `@GetMapping("/{companyId}")`, caso de uso ni consulta JDBC. Se añadió el flujo de lectura separado, con autorización de plataforma antes del store; no se reutilizó `CurrentCompanyQuery` porque limita a empresas `ACTIVE` y es una proyección contractual de tenant.

## Evidencia

`mvn -q -Dtest=CompanyControllerTest,GetCompanyServiceTest,CompanyCreationTransactionTest test` y `mvn -q clean verify`: PASS. `git diff --check`: PASS.

## Delta de trazabilidad

El Candidate-ID se calcula sobre el diff backend rastreado y los archivos backend nuevos mediante `git diff --binary HEAD -- backend/followupbussiness` más `git diff --no-index --binary -- NUL` para cada archivo nuevo; así cubre el flujo añadido sin incluir artefactos de handoff. No cambió código, contrato ni controles.
