# INT-001 — Informe de Seguridad

- **Estado:** `PASS`
- **Candidate-ID:** `e01c35c+0061cef1e255`

## Superficie revisada

`GET /platform/companies/{companyId}`: autenticación, rol/`tenantId`, controlador, `GetCompanyService`, puerto de lectura y consulta JDBC.

## Controles y evidencia

- **PASS — integridad del candidato:** `HEAD` es `e01c35c`; el digest reproducido sobre `git diff --binary HEAD -- backend/followupbussiness` más los cinco archivos backend nuevos, ordenados y aportados con `git diff --no-index --binary -- NUL`, es `0061cef1e255…`. Paquete, Desarrollo y QA coinciden. El estado y el diff de producción son los mismos revisados durante el abuso anterior; la corrección fue solo de trazabilidad.
- **PASS — autorización/aislamiento:** se exige actor autenticado, rol exacto `PLATFORM_SUPERADMIN` y `tenantId == null` antes de `CompanyDetailStore`. No se ampliaron ni eliminaron filtros existentes de rol, tenant o empresa.
- **PASS — entrada y datos:** UUID tipado y consulta parametrizada `WHERE c.id=?`; no se observó divulgación previa a autorización.
- **PASS — abuso decisivo reutilizado:** `GetCompanyServiceTest#tenantBoundPlatformActorIsDeniedBeforeTheStoreIsRead` rechazó al actor ligado a tenant y confirmó ausencia de consulta al store. No se repitieron suites; QA y `clean verify` permanecen PASS para el mismo código.

## Hallazgos y riesgo residual

`SEC-GATE-01` cerrado; no quedan hallazgos abiertos. No aplican cambios en secretos, ubicación/datos personales, almacenamiento local, WebSocket, Redis, mensajería, archivos, dependencias o infraestructura. Riesgo residual bajo: falta una única prueba HTTP extremo a extremo con token real, aunque autenticación, REST y persistencia fueron validadas por separado.
