# Handoff Desarrollo Backend — BE-006

- Estado: `READY_FOR_HANDOFF`
- Candidate-ID: `b562037 + a83c1c52d3fa` (SHA-256 funcional de fuentes Java `identityaccess`; excluye handoffs y grafo).
- Alcance: remediación QA de terminalidad de notificaciones de identidad.

## Entrega

- [JdbcIdentityNotificationAdapter.java](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/identityaccess/adapter/out/persistence/JdbcIdentityNotificationAdapter.java): `delivered` y `erase` exigen ahora `superseded_at IS NULL`; `erase` deja de usar `COALESCE`. Las tres transiciones fallan explícitamente cuando afectan cero filas y conservan la comparación null-safe de tenant.
- [IdentityNotificationPersistenceIntegrationTest.java](../../../backend/followupbussiness/src/test/java/com/nahui/followupbussiness/identityaccess/persistence/IdentityNotificationPersistenceIntegrationTest.java): negativos PostgreSQL para plataforma (`company_id=NULL`) tras crypto-erase, e integración de tenant incorrecto y lease de reclamo.

## Contratos y migraciones

Sin cambios a OpenAPI, puertos ni migraciones.

## Verificación

- `mvn test '-Dtest=IdentityNotificationPersistenceIntegrationTest'` — PASS, 7 pruebas con PostgreSQL 17/Flyway V19.
- `git diff --check` — PASS para el diff rastreado.
- `graphify update .` — actualizado.

## Criterios, riesgos y reproducción

- Cubre transición única: `erase` repetido y `delivered`/`retry` posteriores a `erase` fallan; el trabajo plataforma no vuelve a reclamarse. Mantiene aislamiento de tenant y evita doble reclamo mientras vive el lease.
- Riesgo residual: los flujos HTTP/Redis no se reejecutaron, pues no intervienen en este delta de persistencia.

Reproducción: en PostgreSQL, encolar y reclamar una notificación de cuenta plataforma, ejecutar `erase` con tenant `null` y repetir `erase`, `delivered` y `retry`; cada repetición debe lanzar `IllegalStateException` y `claimDue` debe permanecer vacío.
