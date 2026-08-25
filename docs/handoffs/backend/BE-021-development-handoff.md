# BE-021 — Handoff Development

**Estado:** `READY_FOR_HANDOFF`  
**Candidate-ID:** `27f65e2+BE021-F21FF90E9F50`

**Alcance:** `POST /routes` crea rutas `DRAFT` con hasta 500 clientes y secuencia estable. [Routing](../../../backend/followupbussiness/src/main/java/com/nahui/followupbussiness/routing) conserva hexágono, tenant derivado, autorización de admin/supervisor, vendedor activo y cartera vigente por fecha mediante puertos públicos de Customers/Workforce.

**Archivos/contratos:** controlador REST, caso de uso, almacenamiento JDBC y [migración V42](../../../backend/followupbussiness/src/main/resources/db/migration/V42__create_routes.sql). Se amplió el puerto público de cartera para resolver clientes activos asignados al vendedor en la fecha operativa. El contrato OpenAPI existente de `/routes` queda satisfecho; no se emiten `route.*`, outbox ni notificación. Auditoría interna transaccional: `CRITICAL_MUTATION/ROUTE`, estado `DRAFT`.

**Idempotencia:** clave vinculada a tenant+actor+operación+fingerprint; replay exacto retorna la ruta original; payload/contexto distinto da `409`; múltiples `DRAFT` con claves nuevas son válidos.

**Remediación Seguridad:** el replay exacto vuelve a comprobar autorización vigente (rol, vendedor activo, equipo y cartera) antes de leer/devolver la ruta. Revocar alcance devuelve `403` sin escritura, auditoría ni eventos.

**Remediación QA:** `startLocation` ahora viaja REST → comando → agregado → fingerprint → PostGIS/JDBC → respuesta. `mvn -q '-Dtest=CreateRouteServiceTest' test` PASS (3/3), incluyendo preservación en el agregado; `git diff --check` PASS.

**Riesgo/evidencia pendiente:** `mvn clean verify` no pudo completar por dos migraciones concurrentes que ocuparon V39/V40 y luego bloqueo de `target`; migración ajustada a V42. `mvn verify` completo mostró incompatibilidad de Mockito dentro de la suite completa, pero la prueba aislada pasa. QA debe repetir la validación completa sobre el candidato sin procesos concurrentes y añadir integración PostgreSQL del almacenamiento de rutas.

**Reproducción:** POST autenticado como admin/supervisor a `/routes`, con `Idempotency-Key`, `date`, `sellerId` y `customerIds` de cartera vigente; repetir idéntico devuelve la misma ruta; reutilizar clave con cuerpo distinto devuelve 409.
