# Paquete de contexto — BE-013 Registrar cliente

**Estado actual:** BLOCKED  
**Candidate-ID:** `HEAD 5702c0a + BE-013 customers/V28/PostGIS/REST/auditoría-atómica`.

## Predecesoras verificadas

- `BE-062`: DoF `PASS` en `docs/handoffs/dof/BE-062-dof.md`; el catálogo de territorios está disponible.
- `EN-014`: ADR-013 aceptado y política estable en `docs/architecture/maps/EN-014-capability-policy.md`; PostGIS es la autoridad, con punto confirmado WGS84/SRID 4326. No se geocodifica en esta historia.

## Alcance y contrato

Implementar exclusivamente `POST /customers`, con `CreateCustomerRequest`, `GeoPoint` y `Customer` de `docs/api/openapi.yaml`. Solo `COMPANY_ADMIN` autenticado crea en el tenant derivado de sesión. `SUPERVISOR`, `SELLER`, no autenticado, `PLATFORM_SUPERADMIN` y demás roles reciben denegación. No aceptar tenant ni propiedades adicionales en el cuerpo.

Validar requeridos, límites contractuales, GeoPoint (latitud -90..90, longitud -180..180), territorio existente/activo/del tenant y respuestas 201/400/403/409/422. Persistir punto PostGIS con SRID 4326. La operación, relación territorial y auditoría exitosa deben ser atómicas; rechazos no escriben ni auditan. Propagar `correlationId`; errores, auditoría, métricas, eventos y evidencia omiten PII y ubicación exacta.

Invariantes: actor/recurso (solo admin y tenant de sesión); éxito (cliente activo disponible); denegación (403 y cero efectos); conflicto/duplicado según contrato; fallo/rollback (cero efectos). Puertos alcanzables: autenticación/actor, cliente PostGIS, territorio, transacción y auditoría/observabilidad.

## Delta de política de duplicados

El alcance de BE-015 ahora asigna la advertencia RN-015 a
`POST /customers/duplicate-checks`: candidato tenant-scoped y campos
coincidentes, informativo y sin crear ni bloquear. BE-013 no infiere ni
reimplementa detección; su `POST /customers` conserva `Customer` en 201. Un
posible duplicado no usa `409` ni deja estado parcial. Este cambio explícito
resuelve el bloqueo anterior; el handoff de Desarrollo debe reemplazarse al
reanudar.

## Delta de remediación QA

QA halló que la auditoría podía confirmar separada del cliente. Desarrollo la
movió al mismo `JdbcTemplate` transaccional y añadió integración que provoca
un fallo diferido después de auditar y verifica cero cliente/cero auditoría.
La revalidación QA se limita a ese cierre y a regresión directa. El último
`clean verify` local no concluyó por timeout; se conserva el `PASS` previo y
la evidencia focalizada posterior.

## Cierre de flujo

Dev quedó `READY_FOR_HANDOFF`, QA revalidó `PASS` y Seguridad `PASS` para el
Candidate-ID actual. DoF quedó `BLOCKED`: el último `clean verify` del
candidato corregido no concluyó por timeout y el handoff Dev no porta el
Candidate-ID actualizado. No se afirma evidencia que no existe. Para
desbloquear: ejecutar `mvn -q clean verify` sobre este árbol, actualizar el
handoff Dev con el Candidate-ID vigente y reiniciar DoF sobre ese mismo
candidato.

## Artefactos esperados

- Dev: `docs/handoffs/backend/BE-013-development-handoff.md`.
- QA: `docs/handoffs/qa/BE-013-qa-handoff.md`.
- Seguridad: `docs/handoffs/security/BE-013-security-review.md`.
- DoF: `docs/handoffs/dof/BE-013-dof.md`.
