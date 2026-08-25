# Paquete de contexto — BE-021

**Estado:** `PASS`  
**Candidate-ID:** `27f65e2+BE021-F21FF90E9F50`

## Alcance solicitado

`POST /routes` para `COMPANY_ADMIN` y `SUPERVISOR`: ruta manual `DRAFT`, fecha, vendedor, hasta 500 clientes ordenados, tenant y cartera autorizados derivados de sesión, idempotencia, auditoría y observabilidad sin datos sensibles. Quedan fuera optimización, publicación, reasignación, navegación y tracking.

## Invariantes preparados

- Éxito: persistencia atómica de ruta `DRAFT`, puntos secuenciales 1..n, versión inicial y recursos autorizados.
- Denegación: actor, vendedor, cliente, cartera o tenant no autorizados no escriben ruta/puntos/eventos ni auditoría de éxito.
- Conflicto: el mismo `Idempotency-Key` debe devolver resultado consistente; concurrencia no duplica efectos.
- Falla: validación, persistencia o publicación fallida deja cero efectos parciales.
- Observabilidad: correlationId, auditoría y métricas sin nombres, direcciones, coordenadas ni payload completo.

## Decisiones cerradas

1. Crear la ruta en `DRAFT` sí registra auditoría transaccional interna `ROUTE_CREATED` (o la acción equivalente del mecanismo existente), pero no emite `route.*`, outbox de notificación ni avisa al vendedor. `route.published` se reserva para BE-024. No se crea `route.created`.
2. Se permiten múltiples rutas `DRAFT` para el mismo vendedor y fecha. La guardia de duplicidad es exclusivamente idempotencia: misma clave con mismo actor/tenant/operación/fingerprint devuelve el resultado original; misma clave con contexto o payload distinto devuelve `409`; claves nuevas representan comandos distintos permitidos.

La cartera vigente sí tiene base: `00_CONTRATO_FUNCIONAL.md`, HU-013/§14.16, y BE-060 mantienen asignaciones con `vigente_desde`/`vigente_hasta`; la semántica exacta para la fecha operativa deberá reutilizarse desde el puerto público de Customers, sin acceso directo a su persistencia.

La viabilidad por horario, duración y desplazamiento no se calcula en BE-021. Es una validación/aviso posterior de edición, optimización o publicación, cuando exista política explícita.

## Próximo gate

Development → QA independiente → Seguridad → DoF, sin commits.

## Delta Development

Implementado `POST /routes`: persistencia atómica `DRAFT` con puntos 1..n y versión 1; tenant y actor derivados de sesión; alcance de `COMPANY_ADMIN`/`SUPERVISOR`, vendedor activo y cartera vigente de Customers para la fecha operativa. La idempotencia se vincula a tenant, actor, operación, clave y fingerprint; replay exacto devuelve la misma ruta y divergencia devuelve `409`. Se registra auditoría interna transaccional `CRITICAL_MUTATION/ROUTE`, sin outbox ni eventos `route.*`. Migración `V42__create_routes.sql` preserva claves tenant-compuestas. Evidencia focalizada PASS; `clean verify` no concluyó por colisiones/bloqueo concurrentes de migración/`target`; `verify` completo quedó afectado por Mockito bajo la suite, mientras la prueba Routing aislada pasa.

## Delta QA

Remediación revalidada: `startLocation` fluye REST → comando → agregado → fingerprint SHA-256 → PostGIS/JDBC → respuesta. Misma clave con ubicación distinta retorna conflicto; replay exacto conserva el resultado. QA ejecutó prueba focalizada y Flyway/PostGIS V42: `PASS`. Riesgo residual no ejecutado: falta prueba REST e integración directa `JdbcRouteStore` para inserción/lectura de ubicación; `verify` completo permanece sin evidencia concluyente por Mockito.

## Delta Development (remediación)

`startLocation` se propaga de DTO REST a comando, agregado, fingerprint de idempotencia, columna PostGIS `route.start_location`, lectura JDBC y respuesta. Cambiar solo esta ubicación con la misma clave ya produce conflicto. Prueba de caso de uso PASS; QA conserva la verificación REST y PostgreSQL solicitada.

## Delta Seguridad

`PASS` para `27f65e2+BE021-F21FF90E9F50`: cerrado el hallazgo Medio. El replay reevalúa vendedor, equipo y cartera antes de leer la ruta; pérdida de alcance produce `403` sin exposición, escritura ni auditoría. La reproducción focalizada y el replay autorizado pasaron. REST/PostgreSQL y concurrencia quedaron `NOT_EXECUTED`, reutilizando el riesgo residual de QA.

## Delta Development (seguridad)

Antes de devolver un replay exacto, el caso de uso revalida rol, vendedor activo, alcance de equipo y cartera vigente. Si falla devuelve `403` antes de `routes.find`, sin ruta, escrituras ni auditoría. La prueba focalizada cubre la pérdida de alcance y conserva replay para actor autorizado.

## Delta DoF

`PASS` para `27f65e2+BE021-F21FF90E9F50`: Development, QA y Security coinciden; no hay hallazgos abiertos. `mvn -q clean verify` aislado terminó con exit code `0`, 118 reportes Surefire, SBOM `target/sbom/application.cdx.json` y Flyway/PostGIS hasta `V42`; no cambió código ni Candidate-ID. `git diff --check` pasa.
