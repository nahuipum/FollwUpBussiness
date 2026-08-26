# BE-024 — Desarrollo Backend

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `538b07a + 005b1cc458c4`

## Alcance y decisiones

Implementado `POST /routes/{routeId}/publish`: actor/tenant de sesión, `COMPANY_ADMIN` o `SUPERVISOR` con equipo vigente, vendedor activo, `DRAFT` + `If-Match`, snapshot `VALID` de la misma versión, incremento de versión y transición atómica a `PUBLISHED`.

La repetición exacta con `Idempotency-Key` retorna la ruta sin segundo write/auditoría/outbox; una solicitud incompatible genera conflicto. `notifySeller` se conserva como booleano opcional del payload de `route.published` v1, incluidos siempre el evento y el destinatario técnico. No se implementó push/BE-053/Mobile.

**Delta QA:** las reservas legacy de CREATE ahora insertan, consultan y completan con `operation='CREATE'`, compatible con la PK de V46 y separada de PUBLISH.

**Delta Security:** con `followupbussiness.outbox.enabled=false` se registra un caso de uso de publicación de fallo seguro (503) sin requerir `OutboxStore`; con outbox habilitado, `TransactionTemplate` SERIALIZABLE envuelve ruta, auditoría, outbox e idempotencia sin depender de proxy AOP sobre el servicio.

## Archivos

- Caso/puertos/adaptador/configuración: `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing/`.
- Migración: `backend/followupbussiness/src/main/resources/db/migration/V46__separate_route_publish_idempotency.sql`; separa las claves de creación y publicación.
- Pruebas: `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/routing/application/PublishRouteServiceTest.java` y `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/routing/persistence/JdbcRouteStoreIdempotencyIntegrationTest.java`.

## Verificación

- `mvn -q '-Dtest=JdbcRouteStoreIdempotencyIntegrationTest,CreateRouteServiceTest,PublishRouteServiceTest' test` — PASS; Flyway aplica V46 y confirma CREATE/PUBLISH con la misma clave, replay y colisión CREATE.
- `mvn -q '-Dtest=FollowupbussinessApplicationTests,PublishRouteServiceTest' test` — PASS; el contexto inicia sin `OutboxStore` cuando el flag está deshabilitado.
- Evidencia previa aún válida: `mvn -q clean verify` — PASS; Flyway aplicó V46 sobre PostgreSQL Testcontainers.
- `git diff --check` — PASS.

## Criterios y riesgos

Cubiertos éxito, denegación de alcance/vendedor, snapshot ausente, replay idempotente, auditoría y outbox sin PII/coordenadas, coexistencia de clave CREATE/PUBLISH y arranque sin outbox. Riesgo residual: la entrega y el push son responsabilidad posterior de BE-053; reproducir con una ruta DRAFT, snapshot VALID de su versión, vendedor activo y `If-Match` vigente.
