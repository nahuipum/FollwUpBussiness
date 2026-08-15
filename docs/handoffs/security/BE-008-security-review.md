# BE-008 — Revisión de Seguridad

Estado: `PASS`  
Candidate-ID: `HEAD c38dad7 + BE-008 rollback-audit-integration/pruebas`.

## Superficie revisada

`POST /sellers`; autorización e identidad; aislamiento por `tenantId`; invitación `SELLER`; validación de supervisor/territorios; persistencia y rollback; respuesta, auditoría y migración V27.

## Hallazgos y controles

Sin hallazgos abiertos (`Critical/High/Medium/Low`: ninguno).

- `PASS` — abuso reproducible: `mvn -q "-Dtest=SellerServiceTest#onlyAdminCanCreateAndInactiveRelationCreatesNothing" test`. Un `SUPERVISOR` recibe `Forbidden` antes de invitación/persistencia; referencias inactivas o ajenas al tenant no crean vendedor.
- `PASS` — `tenantId` proviene exclusivamente de `AuthenticatedActor`; las consultas filtran tenant, estado y rol.
- `PASS` — no se aceptan/devuelven contraseña, token o enlace; auditoría solo conserva ID y `status=ACTIVE`; errores genéricos.
- `PASS` — QA verificó rollback de cuenta, perfil, relaciones, token e invitación ante fallo de auditoría.

## Riesgo residual

WebSocket, Redis, archivos, pagos, dependencias e infraestructura: no aplican. `NOT_EXECUTED`: abuso HTTP dedicado; 403 y cuerpos genéricos fueron inspeccionados. Riesgo bajo: email/teléfono contractual solo para `COMPANY_ADMIN`; añadir prueba HTTP negativa futura.
