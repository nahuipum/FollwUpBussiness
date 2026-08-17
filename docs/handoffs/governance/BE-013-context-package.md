# Paquete de contexto — BE-013 Registrar cliente

**Estado actual:** READY_FOR_HANDOFF
**Candidate-ID:** `HEAD dde8160cc7cd249cb7bab8def95f700487789086 + dbb4655c`.

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

Desarrollo quedó `READY_FOR_HANDOFF` para el Candidate-ID vigente. La
composición transaccional de auditoría se trasladó al módulo `audit` y
`customers` consume su puerto calificado; el puerto general quedó `@Primary`.
La prueba de límite modular, la integración de rollback cliente–auditoría y el
arranque Spring pasaron; `mvn -q "-Dmaven.repo.local=C:\Users\LUIS\.m2\repository"
clean verify` pasó en 212 s, al igual que `git diff --check`. Los resultados
QA y Seguridad anteriores corresponden al Candidate-ID previo: QA debe
revalidar el cierre antes de DoF y Seguridad reabre solo si cambia la
superficie sensible o la evidencia decisiva.

## Artefactos esperados

- Dev: `docs/handoffs/backend/BE-013-development-handoff.md`.
- QA: `docs/handoffs/qa/BE-013-qa-handoff.md`.
- Seguridad: `docs/handoffs/security/BE-013-security-review.md`.
- DoF: `docs/handoffs/dof/BE-013-dof.md`.
