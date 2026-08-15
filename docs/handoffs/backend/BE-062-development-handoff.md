# BE-062 — Desarrollo Backend (remediación de arranque)

**Estado:** READY_FOR_HANDOFF

**Candidate-ID:** `HEAD 14b5223b2280 + BE-062 workforce/audit/V26/pruebas de servicio+HTTP+proxy/handoffs`.

## Alcance

Se eliminó únicamente `final` de `TerritoryService`. Conserva `@Transactional` en crear y editar para que Spring pueda generar su proxy CGLIB; no cambian reglas, puertos, autorización, aislamiento tenant, contrato ni migración.

## Rutas

- `backend/followupbussiness/src/main/java/com/nahui/followupbussiness/workforce/application/TerritoryService.java`
- `backend/followupbussiness/src/test/java/com/nahui/followupbussiness/workforce/config/TerritoryServiceTransactionalProxyTest.java`

## Evidencia y criterios cubiertos

- El contexto con `@EnableTransactionManagement`, `TerritoryService` y `PlatformTransactionManager` arranca y expone el servicio como proxy AOP. Antes de la corrección habría fallado al intentar subclasificar la clase final.
- El contexto completo de aplicación continúa arrancando; las transacciones de las mutaciones permanecen asesoradas.

## Validación

- `.\\mvnw.cmd -q "-Dtest=TerritoryServiceTransactionalProxyTest,FollowupbussinessApplicationTests" test`: PASS.
- `.\\mvnw.cmd -q clean verify`: PASS (incluye integración PostgreSQL/Flyway y migración V26).
- `git diff --check`: PASS.

## Riesgo y reproducción

Riesgo residual bajo: la prueba de proxy usa un administrador transaccional simulado para aislar el fallo de infraestructura. Reproducir con el comando focalizado anterior; el fallo previo era `Cannot subclass final class TerritoryService`.
