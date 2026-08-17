# Revisión de Seguridad — BE-010

**Estado:** PASS  
**Candidate-ID:** `HEAD d63e4bc + BE-010 status/tenant-CAS/revocación BE-005/guard de asignación` — coincide con paquete, QA y árbol inspeccionado.

## Superficie revisada

`PATCH /sellers/{sellerId}/status`, autorización, `tenantId`, CAS, `CompanyUserService.status`, revocación de credenciales, access/refresh/login, auditoría, respuesta y guard de asignación. Se abrió `docs/api/openapi.yaml`, endpoint/esquema `Seller`, sólo para resolver la ambigüedad sobre PII en `200`.

## Resultado y evidencia

- **PASS — autorización/tenant:** `admin(actor)` excluye roles no permitidos; lectura y CAS SQL incluyen `tenant_id`. QA comprobó rol y cross-tenant sin efectos.
- **PASS — revocación:** inactivar actualiza la cuenta, incrementa versión, revoca todas las familias e invalida tickets de acción dentro de la misma transacción. Access revalida sesión no revocada y cuenta `ACTIVE`; refresh y login también exigen cuenta activa. Reactivar no limpia `revoked_at` ni revive tokens.
- **PASS — datos:** errores `403/404/409/400` son genéricos; auditorías guardan sólo estados y `reason=PROVIDED`; no se registran motivo, PII ni secretos. La respuesta `Seller` con PII está limitada al administrador del tenant y coincide con OpenAPI.
- **PASS — access previo:** `mvn -q -Dtest=InboundJwtAuthenticatorTest#rejectsWhenThePersistedSessionDoesNotResolveExactlyOneActor test` — PASS; una sesión ya no resoluble impide crear actor autenticado.
- **PASS — abuso de PATCH reproducido:** `mvn -q -Dtest=SellerStatusServiceTest#rejectsUnauthorizedCrossTenantRepeatedAndInvalidWithoutIdentityWritesOrAudit test` — PASS. El flujo del endpoint rechazó al `SUPERVISOR` con `Forbidden` (`403` genérico en el controlador) y ocultó el vendedor al administrador de otro tenant con `NotFound` (`404` genérico); quedaron en cero llamadas a identidad/revocación, escrituras de estado y auditorías.

**Hallazgos:** ninguno.  
**NOT_EXECUTED:** no se repitieron abusos runtime de refresh/ticket/login; se reutilizó evidencia BE-005/QA y se inspeccionaron sus controles.  
**No aplican:** secretos, archivos, WebSocket, caché/Redis, mensajería, dependencias e infraestructura sin cambios.  
**Riesgo residual:** el primer productor de rutas/asignaciones deberá invocar `requireActiveForAssignment()` y demostrar rechazo integrado sin escritura.
